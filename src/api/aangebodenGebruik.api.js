// Imports => Constants
import { ENDPOINTS } from '@constants';

/**
 * API service for AangebodenGebruik endpoints
 * Handles gebruik suggestions where the active organization is involved
 * either as afnemer or in deelnemers list
 */
export class AangebodenGebruikAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  /**
   * Get gebruiks where active organization is afnemer
   * @param {Object} params - Query parameters (limit, offset, status, product, etc.)
   * @returns {Promise} API response with gebruiks data in standard format
   */
  getAfnemerGebruiks(params = {}) {
    return this.Client.get(ENDPOINTS.AANGEBODEN_GEBRUIK.AFNEMER, { params }).then(
      (response) => response.data
    );
  }

  /**
   * Get gebruiks where active organization is in deelnemers
   * @param {Object} params - Query parameters (limit, offset, status, product, etc.)
   * @returns {Promise} API response with gebruiks data
   */
  getDeelnemersGebruiks(params = {}) {
    return this.Client.get(ENDPOINTS.AANGEBODEN_GEBRUIK.DEELNEMERS, { params }).then(
      (response) => response.data
    );
  }

  /**
   * Claim a gebruik suggestion by setting @self.organisation to active organization
   * @param {string} gebruikId - UUID of the gebruik to claim
   * @returns {Promise} API response with updated gebruik
   */
  claimGebruik(gebruikId) {
    return this.Client.put(ENDPOINTS.AANGEBODEN_GEBRUIK.SET_SELF(gebruikId)).then(
      (response) => response.data
    );
  }

  /**
   * Deny a gebruik suggestion by deleting it
   * @param {string} gebruikId - UUID of the gebruik to deny
   * @returns {Promise} API response confirming deletion
   */
  denyGebruik(gebruikId) {
    return this.Client.delete(ENDPOINTS.AANGEBODEN_GEBRUIK.DENY(gebruikId)).then(
      (response) => response.data
    );
  }

  /**
   * Get koppelingen gebruiks where active organization is involved
   * @param {Object} params - Query parameters (limit, offset, status, product, etc.)
   * @returns {Promise} API response with koppelingen gebruiks data in standard format
   */
  getKoppelingenGebruiks(id) {
    return this.Client.get(ENDPOINTS.AANGEBODEN_GEBRUIK.KOPPELING(id)).then(
      (response) => response.data
    );
  }

  /**
   * Get API documentation
   * @returns {Promise} API documentation
   */
  getDocs() {
    return this.Client.get(ENDPOINTS.AANGEBODEN_GEBRUIK.DOCS).then(
      (response) => response.data
    );
  }
}

export default AangebodenGebruikAPI;
