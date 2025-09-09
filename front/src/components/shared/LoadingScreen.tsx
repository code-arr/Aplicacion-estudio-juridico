import LogoApp from "@/assets/logos/logo-iya.png";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
      <img src={LogoApp} alt="Logo" className="h-40 w-auto" />
      <div className="w-12 h-12 border-4 border-[hsl(210,100%,45%)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
export default LoadingScreen;
