/**
 * Статистика приёма подачи команды.
 */
export interface IReception {
  /**
   * Общее количество приёмов.
   */
  total: number;

  /**
   * Количество ошибок на приёме.
   */
  errors: number;

  /**
   * Количество негативных приёмов.
   */
  negative: number;

  /**
   * Количество идеальных приёмов.
   */
  perfect: number;

  /**
   * Процент идеальных приёмов (от 0 до 100).
   */
  percentPerfect: number;
}
