const NOME_ABA_TAREFAS = 'Tarefas';
const NOME_ABA_LOGS = 'Logs';

// Gerencia qual página abrir (Index ou Admin)
function doGet(e) {
  var pagina = e.parameter.p || 'Index';
  return HtmlService.createTemplateFromFile(pagina)
    .evaluate()
    .setTitle(pagina === 'Admin' ? 'Admin - Gestão CGR' : 'Painel CGR Proativo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- FUNÇÕES COMPARTILHADAS ---
function getResponsaveis() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_TAREFAS);
  const data = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues();
  return [...new Set(data.map(r => r[0]).filter(String))].sort();
}

// --- FUNÇÕES DA PÁGINA DO USUÁRIO ---
function getTarefasDoDia(responsavel, dataISO) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetTarefas = ss.getSheetByName(NOME_ABA_TAREFAS);
  const sheetLogs = ss.getSheetByName(NOME_ABA_LOGS);
  
  const dadosTarefas = sheetTarefas.getDataRange().getValues();
  // A MÁGICA AQUI: Lemos exatamente o que está escrito na tela para evitar fuso horário
  const dadosDisplay = sheetTarefas.getDataRange().getDisplayValues(); 
  
  let dadosLogs = (sheetLogs.getLastRow() > 1) ? sheetLogs.getDataRange().getValues() : [];

  const dataRef = new Date(dataISO + 'T12:00:00');
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diaSemanaStr = diasSemana[dataRef.getDay()];

  let tarefasFiltradas = [];
  for (let i = 1; i < dadosTarefas.length; i++) {
    let [, cat, desc, resp, rotina, rec] = dadosTarefas[i]; // ignora horário antigo
    let horarioExato = dadosDisplay[i][0]; // Pega o texto visual da planilha (ex: "07:15")

    if (resp === responsavel && (rotina === 'Diário' || (rec && rec.includes(diaSemanaStr)))) {
      let status = 'Pendente', coment = '';
      for (let j = dadosLogs.length - 1; j >= 1; j--) {
        let logData = (dadosLogs[j][1] instanceof Date) ? dadosLogs[j][1].toISOString().split('T')[0] : dadosLogs[j][1];
        if (logData === dataISO && dadosLogs[j][2] === responsavel && dadosLogs[j][4] === desc) {
          status = dadosLogs[j][5]; coment = dadosLogs[j][6]; break;
        }
      }
      tarefasFiltradas.push({ horario: horarioExato, tarefa: desc, status, comentario: coment });
    }
  }
  return tarefasFiltradas;
}

function salvarLog(dados) {
  const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_LOGS);
  sheetLogs.appendRow([new Date(), dados.dataReferencia, dados.responsavel, dados.horario, dados.tarefa, dados.status, dados.comentario]);
  return true;
}

// --- FUNÇÕES DA ADMINISTRAÇÃO ---
function getTodasTarefas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_TAREFAS);
  const data = sheet.getDataRange().getValues();
  const displayData = sheet.getDataRange().getDisplayValues(); // A MÁGICA AQUI
  
  return data.slice(1).map((r, i) => ({ 
    id: i + 2, 
    horario: displayData[i + 1][0], // Puxa o horário exatamente como texto
    categoria: r[1], 
    descricao: r[2], 
    responsavel: r[3], 
    rotina: r[4], 
    recorrencia: r[5] 
  }));
}

function salvarAlteracaoTarefa(id, dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_TAREFAS);
  const linha = Number(id);
  // Remove a validação da célula de Recorrência para aceitar múltiplos dias
  sheet.getRange(linha, 6).clearDataValidations();
  sheet.getRange(linha, 1, 1, 6).setValues([[dados.horario, dados.categoria, dados.descricao, dados.responsavel, dados.rotina, dados.recorrencia]]);
}

function adicionarNovaTarefa(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_TAREFAS);
  sheet.appendRow([dados.horario, dados.categoria, dados.descricao, dados.responsavel, dados.rotina, dados.recorrencia]);
  const ultimaLinha = sheet.getLastRow();
  // Remove a validação da nova linha criada para evitar problemas
  sheet.getRange(ultimaLinha, 6).clearDataValidations();
}

function excluirTarefa(id) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_TAREFAS).deleteRow(id);
}

// --- FUNÇÃO DO RELATÓRIO SEMANAL ---
function getResumoSemana(responsavel, dataFimISO) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetTarefas = ss.getSheetByName(NOME_ABA_TAREFAS);
  const sheetLogs = ss.getSheetByName(NOME_ABA_LOGS);

  const dadosTarefas = sheetTarefas.getDataRange().getValues();
  const dadosDisplay = sheetTarefas.getDataRange().getDisplayValues(); // A MÁGICA AQUI
  
  let dadosLogs = (sheetLogs.getLastRow() > 1) ? sheetLogs.getDataRange().getValues() : [];

  let dataFim = new Date(dataFimISO + 'T12:00:00');
  let resultados = [];
  const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Volta 7 dias no tempo (incluindo o dia atual selecionado)
  for (let d = 0; d < 7; d++) {
    let dataAtual = new Date(dataFim.getTime());
    dataAtual.setDate(dataFim.getDate() - d);
    
    let dataAtualISO = dataAtual.toISOString().split('T')[0];
    let diaSemanaStr = diasNomes[dataAtual.getDay()];
    let diaFormatado = ("0" + dataAtual.getDate()).slice(-2) + "/" + ("0" + (dataAtual.getMonth() + 1)).slice(-2);

    let tarefasDoDia = [];

    for (let i = 1; i < dadosTarefas.length; i++) {
      let [, cat, desc, resp, rotina, rec] = dadosTarefas[i];
      let horarioExato = dadosDisplay[i][0]; // Puxa a hora como texto

      if (resp === responsavel && (rotina === 'Diário' || (rec && rec.includes(diaSemanaStr)))) {
        let status = 'Pendente';
        let coment = '';
        
        // Puxa o status mais recente daquele dia específico
        for (let j = dadosLogs.length - 1; j >= 1; j--) {
          let logData = (dadosLogs[j][1] instanceof Date) ? dadosLogs[j][1].toISOString().split('T')[0] : dadosLogs[j][1];
          if (logData === dataAtualISO && dadosLogs[j][2] === responsavel && dadosLogs[j][4] === desc) {
            status = dadosLogs[j][5]; 
            coment = dadosLogs[j][6];
            break;
          }
        }
        tarefasDoDia.push({ horario: horarioExato, tarefa: desc, status: status, comentario: coment });
      }
    }

    if (tarefasDoDia.length > 0) {
      resultados.push({
        diaNome: `${diaSemanaStr} (${diaFormatado})`,
        tarefas: tarefasDoDia
      });
    }
  }

  return resultados; // Retorna do mais recente para o mais antigo
}
