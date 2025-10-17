// src/pages/dashboard/items/ItemOverviewPage.tsx
import InfoCard from "@/components/ui/infoCard";
import {
  selectClientItemDetail,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  selectCategory,
  selectItemType,
  selectSection,
  useCatalogStore,
} from "@/store/useCatalogStore";
import { useMemo, useState } from "react";
import MeetingForm from "@/components/meetings/MeetingForm";
import MeetingsOverviewCard from "@/components/meetings/MeetingOverviewCard";

const ItemOverviewPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const item = useClientItemStore(selectClientItemDetail);
  const clientDetail = useClientStore(selectClientDetail);
  const itemType = useCatalogStore(selectItemType(item?.itemTypeId ?? ""));
  const section = useCatalogStore(
    selectSection(
      item?.sectionId
        ? item.sectionId
        : itemType?.sectionId
        ? itemType?.sectionId
        : ""
    )
  );
  const category = useCatalogStore(
    selectCategory(
      item?.categoryId
        ? item.categoryId
        : section?.categoryId
        ? section.categoryId
        : ""
    )
  );

  const fullName =
    clientDetail?.firstName && clientDetail?.lastName
      ? `${clientDetail.firstName} ${
          clientDetail.lastName.split(" ")[0] ?? ""
        }`.trim()
      : clientDetail?.companyName ?? "";

  const clientItemDetail = useClientItemStore((s) => s.clientItemDetail);
  const clients = useClientStore((s) => s.clientsByLawyer);

  const actualClient = useMemo(() => {
    if (!clientItemDetail) return null;
    return clients?.find((c) => c.id === clientItemDetail.clientId) || null;
  }, [clientItemDetail, clients]);

  return (
    <div className="flex px-3 gap-x-6">
      <MeetingForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        lawyerEmail={user?.googleEmail || ""}
        defaultParticipants={[
          {
            name:
              actualClient?.type === "Fisica"
                ? `${actualClient?.firstName}  ${actualClient?.lastName}`
                : actualClient?.companyName || "Cliente",
            email: actualClient?.email || "",
          },
        ]}
      />
      <div className="flex flex-col w-3/4 min-w-0 gap-y-5">
        <InfoCard title="Descripción" titleSize="xl">
          <p className="whitespace-pre-line break-all">{item?.description}</p>
        </InfoCard>
        <div className="flex gap-x-4">
          <InfoCard title="Plazos" className="w-[70%]"></InfoCard>

          <div className="w-[30%]">
            <MeetingsOverviewCard
              itemId={item?.id}
              lawyerEmail={user?.googleEmail || ""}
              defaultParticipants={[
                {
                  name:
                    actualClient?.type === "Fisica"
                      ? `${actualClient?.firstName}  ${actualClient?.lastName}`
                      : actualClient?.companyName || "Cliente",
                  email: actualClient?.email || "",
                },
              ]}
            />
          </div>
        </div>
        <InfoCard title="Tiempo y Honorarios" className="w-[69%]"></InfoCard>
      </div>
      <div className="flex flex-col w-1/4 gap-y-5">
        <InfoCard title="Información">
          <div className="flex flex-col pr-1.5 text-end">
            <div className="flex justify-between">
              <p>Cliente </p>
              <p className="font-medium">{fullName}</p>
            </div>
            <div className="flex justify-between">
              <p>Categoría </p>
              <p className="font-medium">{category?.name}</p>
            </div>
            <div className="flex justify-between">
              <p>Sección </p>
              {section ? (
                <p className="font-medium">{section?.name}</p>
              ) : (
                <div className="bg-gray-200 w-[5.5rem] h-5 mt-[0.1rem] rounded-3xl" />
              )}
            </div>
            <div className="flex justify-between">
              <p>Tipo de ítem </p>
              {itemType ? (
                <p className="font-medium">{itemType?.name}</p>
              ) : (
                <div className="bg-gray-200 w-[5.5rem] h-5 mt-[0.1rem] rounded-3xl" />
              )}
            </div>
          </div>
        </InfoCard>
        <InfoCard title="Actividad"></InfoCard>
      </div>
    </div>
  );
};

export default ItemOverviewPage;
