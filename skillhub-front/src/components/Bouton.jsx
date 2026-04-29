// Import du fichier CSS associé. Vite injecte les styles globalement à l'app.
import './Bouton.css';

/**
 * Composant bouton réutilisable.
 *
 * Centralise les styles de bouton de l'application pour avoir une apparence
 * cohérente partout. Les classes CSS sont composées dynamiquement à partir
 * des props variante / taille pour générer les variantes visuelles
 * (principal, secondaire, fantome, danger) et tailles (petit, moyen, grand).
 *
 * @param {object} props
 * @param {('principal'|'secondaire'|'fantome'|'danger')} [props.variante='principal']
 * @param {('petit'|'moyen'|'grand')} [props.taille='moyen']
 * @param {function} props.onClick Callback de clic
 * @param {boolean} [props.disabled=false] Désactive le bouton
 * @param {('button'|'submit'|'reset')} [props.type='button'] Type HTML
 * @param {React.ReactNode} props.children Contenu interne du bouton
 */
// Déstructure les props en arguments avec valeurs par défaut.
// Si l'appelant ne passe pas "variante", on utilise 'principal'.
export default function Bouton({
    variante = 'principal',  // style visuel : couleur de fond, bordure
    taille   = 'moyen',      // taille : padding et font-size
    onClick,                 // handler de clic, peut être undefined
    disabled = false,        // désactive le bouton (grisé, non-cliquable)
    type     = 'button',     // 'button' = neutre, 'submit' = soumet le form parent
    children,                // contenu (texte, icône, JSX)
}) {
    // Construction de la chaîne de classes CSS.
    // Exemple résultat : "bouton bouton-principal bouton-moyen bouton-desactive"
    // .trim() enlève l'éventuel espace en fin si la classe disabled est vide.
    const classes = [
        'bouton',                              // classe de base commune à tous les boutons
        `bouton-${variante}`,                  // classe modificateur de variante (template literal)
        `bouton-${taille}`,                    // classe modificateur de taille
        disabled ? 'bouton-desactive' : '',    // classe conditionnelle si disabled
    ].join(' ').trim();

    // JSX retourné : un élément <button> HTML standard avec les classes calculées.
    return (
        <button
            type={type}              // attribut HTML type (button/submit/reset)
            className={classes}      // attribut HTML class (renommé en JSX car "class" est mot-clé JS)
            onClick={onClick}        // handler React de clic
            disabled={disabled}      // attribut HTML disabled (grise et bloque les clics)
        >
            {children}               {/* contenu interne du bouton (passé via slot) */}
        </button>
    );
}
