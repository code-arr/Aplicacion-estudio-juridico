import InfoCard from "@components/ui/infoCard";
import {
  selectClientItemDetail,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import {
  selectCategory,
  selectItemType,
  selectSection,
  useCatalogStore,
} from "@/store/useCatalogStore";
import { Button } from "@components/ui/button";

const ItemOverviewPage = () => {
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

  return (
    <div className="flex px-3 gap-x-6">
      <div className="flex flex-col w-3/4 gap-y-5">
        <InfoCard title="Resumen" titleSize="xl">
          <div className="flex">
            <p>{item?.description}</p>
          </div>
        </InfoCard>
        <div className="flex gap-x-4">
          <InfoCard title="Plazos" className="w-[70%]"></InfoCard>

          <InfoCard title="Reuniones" className="w-[30%]">
            <p className="mb-1.5">Próxima:</p>
            <p>Última:</p>
            <Button className="self-center h-8 mt-3 w-32">
              Agendar reunión
            </Button>
          </InfoCard>
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
