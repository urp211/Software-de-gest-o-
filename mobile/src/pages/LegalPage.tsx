import { useSearchParams } from "react-router-dom";

export default function LegalPage() {
  const [params] = useSearchParams();
  const tab = params.get("tab") === "privacy" ? "privacy" : "terms";

  return (
    <div>
      <h1 className="page-title">
        {tab === "privacy" ? "Política de Privacidade" : "Termos e Condições"}
      </h1>
      <p className="page-sub">
        Documento informativo — revisto juridicamente antes de uso comercial (Angola / AGT).
      </p>

      <div className="card" style={{ lineHeight: 1.55, fontSize: "0.92rem" }}>
        {tab === "terms" ? (
          <>
            <h3>1. Aceitação</h3>
            <p>
              Ao utilizar o MAKINA, o utilizador declara ter lido e aceite estes termos.
            </p>
            <h3>2. Conta e credenciais</h3>
            <p>
              O utilizador é responsável pela confidencialidade das suas credenciais e por
              todas as operações efetuadas na sua sessão.
            </p>
            <h3>3. Utilização adequada</h3>
            <p>É proibido tentar contornar permissões, explorar vulnerabilidades, introduzir
              código malicioso ou utilizar o sistema para fins ilegais.</p>
            <h3>4. Dados</h3>
            <p>
              A empresa utilizadora é responsável pela legalidade e exatidão dos dados
              inseridos. Em modo offline, os dados residem no dispositivo.
            </p>
            <h3>5. Disponibilidade</h3>
            <p>
              Podem ocorrer manutenções ou interrupções. Não se garante disponibilidade
              ininterrupta.
            </p>
            <h3>6. Segurança</h3>
            <p>
              São aplicadas medidas como hashing de passwords, controlo de acesso e
              auditoria. Nenhum sistema é 100% invulnerável.
            </p>
            <h3>7. Propriedade intelectual</h3>
            <p>
              Software, marca e design pertencem aos respetivos titulares.
            </p>
            <h3>8. Suspensão</h3>
            <p>
              Contas podem ser suspensas em caso de abuso, fraude ou risco de segurança.
            </p>
            <h3>9. Alterações</h3>
            <p>Estes termos podem ser atualizados; a versão aplicável é a em vigor na app.</p>
            <h3>10. Contacto</h3>
            <p>Suporte: através do administrador da organização.</p>
            <p className="text-muted" style={{ fontSize: "0.8rem" }}>
              Este texto é um modelo genérico e deve ser adaptado por profissional jurídico
              antes de utilização comercial.
            </p>
          </>
        ) : (
          <>
            <h3>1. Dados recolhidos</h3>
            <p>
              Dados de empresa, clientes, produtos, vendas, utilizadores e logs técnicos
              necessários ao funcionamento. Não se recolhem dados desnecessários.
            </p>
            <h3>2. Finalidade</h3>
            <p>
              Gestão operacional, faturação, stock, financeiro, auditoria e segurança.
            </p>
            <h3>3. Armazenamento</h3>
            <p>
              Em modo offline mobile, os dados ficam no armazenamento local do dispositivo
              (IndexedDB). Backups são gerados sob controlo do administrador.
            </p>
            <h3>4. Segurança</h3>
            <p>
              Passwords com hash; permissões por perfil; auditoria de operações críticas.
            </p>
            <h3>5. Partilha</h3>
            <p>
              Não há partilha automática com terceiros. Pacotes multi-dispositivo são
              exportados manualmente pelo administrador.
            </p>
            <h3>6. Direitos</h3>
            <p>
              Pedidos de acesso, correção ou eliminação devem ser dirigidos ao administrador
              da empresa, conforme legislação aplicável (incl. proteção de dados em Angola).
            </p>
            <h3>7. Contacto</h3>
            <p>Administrador da organização / responsável pelo tratamento.</p>
            <p className="text-muted" style={{ fontSize: "0.8rem" }}>
              Modelo informativo — revisão jurídica recomendada.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
