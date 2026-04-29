import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

/*
 * Point d'entrée du bundle React.
 *
 * createRoot crée la racine React 18 (concurrent rendering) sur le div#root
 * de index.html. StrictMode active des vérifications supplémentaires en
 * développement (double-rendering, détection des effets non purs, etc.).
 * StrictMode n'a aucun impact en production.
 */
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
