import { API_ENDPOINTS, apiClient } from '../lib/api';

/**
 * Service for Credit Transfer operations
 */
export const transferService = {
  /**
   * Fetches all accounts under a specific UEN or Customer ID
   * @param {string} uen - Business UEN
   * @returns {Promise<Array>} List of accounts
   */
  fetchRecipientAccounts: async (uen) => {
    if (!uen) return [];
    
    return await apiClient(API_ENDPOINTS.GET_ACCOUNTS_BY_UEN, {
      params: { UEN: uen }
    });
  },

  /**
   * Calculates the charge fee and retrieves transfer details
   * @param {Object} params - Query parameters (CustomerId, RecipientUEN)
   * @param {Object} body - Transfer body (accountFrom, accountTo, transactionAmount, transactionReferenceNumber, narrative)
   * @returns {Promise<Object>} Fee details and confirmation info
   */
  calculateChargeFee: async (params, body) => {
    return await apiClient(API_ENDPOINTS.CHARGE_FEE, {
      method: 'POST',
      params,
      body
    });
  }
};
