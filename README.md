# Organizador de Tarefas Diárias e Rotinas

Sistema web desenvolvido em Google Apps Script (HTML, CSS, JS e Google Sheets) criado para facilitar o acompanhamento de tarefas recorrentes por parte da liderança e a execução diária por parte do time. 

A ferramenta centraliza as rotinas e separa as visões: a liderança gerencia o que, quando e quem deve executar (Painel Admin), e o time visualiza apenas suas pendências do dia, atualizando o progresso em tempo real.

## 🌟 Benefícios e Funcionalidades

* **Visões Separadas (Usuário e Admin):** O acesso padrão carrega a área do colaborador para baixa de tarefas. Adicionando `?p=Admin` à URL, acessa-se o painel de controle da liderança.
* **Gestão de Recorrência Avançada:** No Admin, é possível definir tarefas como Diárias, Mensais ou Semanais, selecionando os dias exatos da semana (Dom a Sáb) em que a tarefa deve aparecer para o colaborador[cite: 10].
* **Relatório Semanal Automático:** O botão "Resumo Semana" abre um modal interativo que busca o histórico de execução dos últimos 7 dias daquele colaborador, agrupando o status de cada tarefa por dia[cite: 10].
* **Histórico Seguro (Logs):** As tarefas não são apagadas no fim do dia. Cada atualização (Pendente, Andamento, Concluído) gera uma nova linha na aba de Logs com data, hora, responsável e comentário obrigatório, criando um histórico de auditoria perfeito[cite: 10].
* **Interface Moderna e Ágil:** Operação em tela única (Single Page Application) com salvamento assíncrono. Conta com notificações flutuantes (Toast) e pop-ups modais para evitar a exclusão acidental de dados[cite: 10].

---

## 🚀 Pré-work (Como colocar o código em funcionamento)

A configuração deste sistema exige a criação de uma planilha específica e o deploy do código. Siga os passos:

### 1. Preparação do Banco de Dados (Google Sheets)
1. Crie uma nova Planilha no Google Sheets.
2. Crie uma aba chamada exatamente **`Tarefas`**[cite: 10]. Na primeira linha, crie as seguintes colunas (de A a F):
   * `Horário` | `Categoria` | `Descrição` | `Responsável` | `Rotina` | `Recorrência`
3. Crie uma segunda aba chamada exatamente **`Logs`**[cite: 10]. Na primeira linha, crie as seguintes colunas (de A a G):
   * `Timestamp` | `Data Referência` | `Responsável` | `Horário` | `Tarefa` | `Status` | `Comentário`

### 2. Configuração do Google Apps Script
1. Na sua planilha, clique em **Extensões > Apps Script**.
2. Crie três arquivos e cole os códigos fornecidos no repositório:
   * **`codigo.gs`**: Lógica de backend e comunicação com a planilha[cite: 10].
   * **`Admin.html`**: Interface da liderança (HTML/CSS/JS)[cite: 10].
   * **`Index.html`**: Interface do colaborador (HTML/CSS/JS)[cite: 10].

### 3. Deploy (Implantação)
1. Clique em **Implantar > Nova implantação**.
2. Tipo: **App da Web**.
3. Executar como: **Eu** | Quem pode acessar: **Qualquer pessoa** (ou limite ao seu domínio Google Workspace).
4. Aceite as permissões. Copie a URL do Web App gerada.

---

## 🛠️ Customização: Implementando em um Novo Ambiente

Para utilizar o sistema em outro setor ou empresa, as seguintes alterações devem ser feitas:

### Lista de Responsáveis Padrão (Admin.html)
O menu *dropdown* do usuário puxa automaticamente os responsáveis listados na aba `Tarefas`[cite: 10]. No entanto, o painel Admin possui um *fallback* (uma lista de nomes reserva) para o momento de criar uma nova tarefa. 
* Localize no arquivo `Admin.html` a linha: `const nomesPadrao = ["Charles", "Daniel", "Gabriel", "Reginaldo", "Wiliam", "N/A"];`[cite: 10].
* Substitua este *array* com os nomes reais da sua nova equipe[cite: 10].

### Nomes das Abas da Planilha (codigo.gs)
Caso sua planilha utilize nomes diferentes (ex: `Tasks` e `Historico`), você deve atualizar as constantes globais logo na primeira linha do `codigo.gs`[cite: 10]:
```javascript
const NOME_ABA_TAREFAS = 'Tarefas';
const NOME_ABA_LOGS = 'Logs';
