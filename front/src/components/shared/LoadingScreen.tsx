const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
      <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
      <div className="w-12 h-12 border-4 border-[hsl(210,100%,45%)] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium text-[hsl(210,100%,25%)]">
        Cargando...
      </p>
    </div>
  );
};
export default LoadingScreen;
