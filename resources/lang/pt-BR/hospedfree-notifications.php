<?php

return [
    'greeting' => 'Olá, :name',
    'security_notice' => 'Por segurança, este e-mail não contém senhas ou credenciais. Entre na sua conta para consultar informações protegidas.',
    'hosting_plan' => 'seu plano de hospedagem',
    'not_available' => 'uma data a confirmar',
    'hosting' => [
        'hosting_ready' => [
            'subject' => 'Sua hospedagem está pronta',
            'line_1' => ':domain está ativo e pronto para você publicar seu site.',
            'line_2' => 'Use o painel HospedFree para gerenciar arquivos, domínios, bancos de dados, SSL e ferramentas.',
            'action' => 'Gerenciar hospedagem',
        ],
        'hosting_provisioning_failed' => [
            'subject' => 'Precisamos concluir a ativação da sua hospedagem',
            'line_1' => 'Não foi possível concluir a ativação de :domain.',
            'line_2' => 'Sua solicitação continua registrada. Abra o painel para consultar a próxima ação ou falar com o suporte.',
            'action' => 'Revisar hospedagem',
        ],
        'hosting_suspended' => [
            'subject' => 'Sua hospedagem foi suspensa',
            'line_1' => 'O acesso a :domain está suspenso no momento.',
            'line_2' => 'Abra o painel para revisar o estado da conta e as opções disponíveis para recuperação.',
            'action' => 'Revisar conta',
        ],
        'hosting_reactivated' => [
            'subject' => 'Sua hospedagem foi reativada',
            'line_1' => ':domain está ativo novamente.',
            'line_2' => 'Você já pode voltar ao painel e continuar gerenciando seu site.',
            'action' => 'Abrir hospedagem',
        ],
        'hosting_password_changed' => [
            'subject' => 'A senha da sua hospedagem foi alterada',
            'line_1' => 'A senha protegida da hospedagem :domain foi alterada com sucesso.',
            'line_2' => 'Se você não solicitou esta alteração, entre na sua conta e fale imediatamente com o suporte.',
            'action' => 'Revisar segurança',
        ],
        'hosting_deletion_scheduled' => [
            'subject' => 'Exclusão da hospedagem agendada',
            'line_1' => 'A exclusão de :domain está agendada para :effective_at.',
            'line_2' => 'Você pode cancelar a exclusão pelo painel enquanto o período de carência estiver ativo.',
            'action' => 'Revisar exclusão',
        ],
        'hosting_deletion_cancelled' => [
            'subject' => 'Exclusão da hospedagem cancelada',
            'line_1' => 'A exclusão agendada de :domain foi cancelada.',
            'line_2' => 'Sua hospedagem permanece disponível com o estado atual da conta.',
            'action' => 'Abrir hospedagem',
        ],
        'hosting_deleted' => [
            'subject' => 'Hospedagem excluída',
            'line_1' => 'A exclusão de :domain foi concluída.',
            'line_2' => 'Essa conta não pode mais ser acessada pelas ferramentas de hospedagem.',
            'action' => 'Ver hospedagens',
        ],
        'hosting_downgrade_scheduled' => [
            'subject' => 'Alteração para o plano Free agendada',
            'line_1' => 'O acesso pago de :domain terminou e a alteração para o plano Free está sendo processada.',
            'line_2' => 'Seu site não será apagado automaticamente. Atualizaremos a conta quando a troca de plano for concluída.',
            'action' => 'Revisar plano',
        ],
        'hosting_plan_changed' => [
            'subject' => 'Seu plano de hospedagem foi atualizado',
            'line_1' => ':domain agora utiliza :plan.',
            'line_2' => 'Os limites e recursos atuais estão disponíveis no seu painel.',
            'action' => 'Ver plano',
        ],
        'hosting_action_required' => [
            'subject' => 'Sua hospedagem precisa de atenção',
            'line_1' => 'Uma operação de :domain não pôde ser concluída automaticamente.',
            'line_2' => 'Abra o painel para revisar a ação segura de recuperação ou falar com o suporte.',
            'action' => 'Revisar hospedagem',
        ],
    ],
    'support' => [
        'ticket_created' => [
            'subject' => 'Chamado de suporte #:ticket recebido',
            'line_1' => 'Recebemos o chamado de suporte #:ticket.',
            'line_2' => 'Você pode acompanhar a conversa e acrescentar informações pelo seu painel.',
            'action' => 'Ver chamado',
        ],
        'ticket_reply' => [
            'subject' => 'Nova resposta no chamado #:ticket',
            'line_1' => 'A equipe de suporte HospedFree respondeu ao chamado #:ticket.',
            'line_2' => 'Abra a conversa para ler a resposta e continuar o atendimento.',
            'action' => 'Ler resposta',
        ],
        'ticket_status_changed' => [
            'subject' => 'Chamado #:ticket atualizado',
            'line_1' => 'O chamado #:ticket agora está :status.',
            'line_2' => 'O histórico completo continua disponível na sua área de suporte.',
            'action' => 'Ver chamado',
        ],
        'ticket_staff_activity' => [
            'subject' => 'Atividade de suporte no chamado #:ticket',
            'line_1' => ':activity no chamado #:ticket.',
            'line_2' => 'Abra a área de suporte para revisar a solicitação. O e-mail não inclui a mensagem nem os anexos do cliente.',
            'action' => 'Abrir suporte',
        ],
    ],
    'support_status' => [
        'open' => 'aberto',
        'pending_customer' => 'aguardando o cliente',
        'pending_support' => 'aguardando o suporte',
        'resolved' => 'resolvido',
        'closed' => 'fechado',
        '' => 'atualizado',
    ],
    'support_activity' => [
        'created' => 'Um novo chamado foi criado',
        'customer_reply' => 'O cliente enviou uma nova resposta',
        '' => 'Há uma nova atividade',
    ],
    'billing' => [
        'payment_failed' => [
            'subject' => 'Não foi possível confirmar o pagamento de :plan',
            'line' => 'Atualize sua forma de pagamento para manter :plan ativo. Se o acesso pago terminar, sua hospedagem será programada para mudar para o plano Free; seu site não será apagado automaticamente.',
            'action' => 'Revisar faturamento',
        ],
        'invoice_available' => [
            'subject' => 'Seu recibo de pagamento está disponível',
            'line' => 'O recibo do seu pagamento mais recente no HospedFree está pronto para consulta.',
            'action' => 'Ver recibo',
        ],
    ],
];
