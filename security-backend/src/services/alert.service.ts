
// Placeholder para o serviço de Alertas
// Em uma implementação real, este serviço interagiria com o banco de dados
// para registrar e buscar alertas.

import { Alert, AlertType } from "../models/Alert"; // Ajustar path
import { PaginatedResponse } from "@/types/contracts"; // Ajustar path
import { v4 as uuidv4 } from 'uuid';

// Simulação de um banco de dados de alertas em memória (APENAS PARA EXEMPLO)
const alertsInMemory: Alert[] = [];

/**
 * Cria um novo alerta para um usuário.
 * @param userId O ID do usuário.
 * @param type O tipo do alerta.
 * @param title O título do alerta.
 * @param message A mensagem do alerta.
 * @param metadata Dados adicionais (opcional).
 * @returns O alerta criado.
 */
export const createAlert = async (
  userId: string,
  type: AlertType,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<Alert> => {
  const newAlert: Alert = {
    id: uuidv4(),
    userId,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    readTimestamp: null,
    metadata,
  };

  console.log(`[AlertService] Criando alerta para User=${userId}, Type=${type}, Title=${title}`);
  alertsInMemory.push(newAlert);

  // Em produção, inserir no banco de dados aqui
  // TODO: Considerar enviar notificação via WebSocket/Push aqui
  await new Promise(resolve => setTimeout(resolve, 15)); // Simula I/O

  return newAlert;
};

/**
 * Busca alertas para um usuário com paginação e filtro de leitura.
 * @param userId O ID do usuário.
 * @param page Número da página.
 * @param limit Número de itens por página.
 * @param readStatus Filtro opcional (true, false, ou undefined para todos).
 * @returns Objeto PaginatedResponse contendo os alertas e informações de paginação.
 */
export const getUserAlerts = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  readStatus?: boolean
): Promise<PaginatedResponse<Alert>["pagination"] & { data: Alert[] }> => {
  console.log(`[AlertService] Buscando alertas para User=${userId}, Page=${page}, Limit=${limit}, ReadStatus=${readStatus}`);

  // Filtrar por usuário e status de leitura (se fornecido)
  let filteredAlerts = alertsInMemory.filter(alert => {
    if (alert.userId !== userId) return false;
    if (readStatus !== undefined && alert.isRead !== readStatus) return false;
    return true;
  });

  // Ordenar por timestamp descendente (mais recentes primeiro)
  filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filteredAlerts.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = filteredAlerts.slice(offset, offset + limit);

  await new Promise(resolve => setTimeout(resolve, 35)); // Simula I/O

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Marca um alerta específico como lido.
 * @param userId O ID do usuário (para garantir que ele só marque seus próprios alertas).
 * @param alertId O ID do alerta a ser marcado.
 * @returns True se o alerta foi encontrado e marcado, False caso contrário.
 */
export const markAlertAsRead = async (userId: string, alertId: string): Promise<boolean> => {
  console.log(`[AlertService] Marcando alerta ${alertId} como lido para User=${userId}`);
  const alertIndex = alertsInMemory.findIndex(alert => alert.id === alertId && alert.userId === userId);

  if (alertIndex !== -1) {
    if (!alertsInMemory[alertIndex].isRead) {
        alertsInMemory[alertIndex].isRead = true;
        alertsInMemory[alertIndex].readTimestamp = new Date().toISOString();
        console.log(`[AlertService] Alerta ${alertId} marcado como lido.`);
        // Em produção, atualizar no banco de dados aqui
        await new Promise(resolve => setTimeout(resolve, 20)); // Simula I/O
    } else {
        console.log(`[AlertService] Alerta ${alertId} já estava marcado como lido.`);
    }
    return true;
  } else {
    console.warn(`[AlertService] Alerta ${alertId} não encontrado ou não pertence ao usuário ${userId}.`);
    return false;
  }
};

