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
export default function Bouton({
    variante = 'principal',
    taille   = 'moyen',
    onClick,
    disabled = false,
    type     = 'button',
    children,
}) {
    // Composition des classes CSS : "bouton bouton-principal bouton-moyen [bouton-desactive]".
    // .trim() enlève l'éventuel espace en fin si la classe disabled est vide.
    const classes = [
        'bouton',
        `bouton-${variante}`,
        `bouton-${taille}`,
        disabled ? 'bouton-desactive' : '',
    ].join(' ').trim();

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
