import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-12">
      <div className="text-center space-y-2">
        <p className="text-4xl">🏥</p>
        <h2 className="text-xl font-bold text-foreground">Page non trouvée</h2>
        <p className="text-sm text-muted-foreground">Le module "{location.pathname}" n'existe pas.</p>
        <a href="/" className="text-primary underline hover:text-primary/90 text-sm">Retour à l'accueil</a>
      </div>
    </div>
  );
};

export default NotFound;
