<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable : email envoyé au destinataire lors du premier message d'une conversation.
 *
 * N'est déclenché qu'une seule fois (au tout premier échange entre deux utilisateurs)
 * pour éviter le spam. La logique de "premier message" est calculée côté MessageController.
 *
 * En environnement local, MAIL_MAILER=log envoie l'email dans storage/logs/laravel.log
 * au lieu de tenter une connexion SMTP réelle.
 */
class NouveauMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Données injectées dans le template HTML — exposées en public pour pouvoir
     * être lues par le moteur de template Blade si on migrait vers une vue.
     */
    public string $expediteur;
    public string $destinataire;
    public string $contenu;
    public string $lienPlateforme;

    /**
     * Initialise le mailable avec les noms des deux interlocuteurs et le contenu du message.
     */
    public function __construct(string $expediteur, string $destinataire, string $contenu)
    {
        $this->expediteur     = $expediteur;
        $this->destinataire   = $destinataire;
        $this->contenu        = $contenu;
        // URL de la plateforme tirée de la config — sert au lien d'action dans l'email.
        $this->lienPlateforme = config('app.url');
    }

    /**
     * Construit le contenu HTML du mail.
     *
     * Le HTML est inline (pas de vue Blade séparée) car simple et auto-suffisant.
     * htmlspecialchars protège contre l'injection HTML/XSS dans le contenu utilisateur.
     */
    public function build(): static
    {
        $html = "
            <h2>Nouveau message reçu sur SkillHub</h2>
            <p>Bonjour <strong>{$this->destinataire}</strong>,</p>
            <p><strong>{$this->expediteur}</strong> vous a envoyé un message :</p>
            <blockquote style='border-left:4px solid #6366f1;padding:12px;background:#f5f3ff;margin:16px 0;'>
                " . nl2br(htmlspecialchars($this->contenu)) . "
            </blockquote>
            <p>Connectez-vous sur <a href='{$this->lienPlateforme}'>{$this->lienPlateforme}</a> pour répondre.</p>
            <p style='color:#888;font-size:12px;'>L'équipe SkillHub</p>
        ";

        return $this->subject('SkillHub — Nouveau message de ' . $this->expediteur)
                    ->html($html);
    }
}
