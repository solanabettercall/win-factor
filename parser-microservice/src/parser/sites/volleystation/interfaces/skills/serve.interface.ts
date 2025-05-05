/**
 * Статистика подач команды.
 */
export interface IServe {
  /**
   * Общее количество подач.
   */
  total: number;

  /**
   * Количество эйсов.
   */
  aces: number;

  /**
   * Количество ошибок на подаче.
   */
  errors: number;

  /**
   * Среднее количество эйсов за сет.
   */
  acesPerSet: number;
}
