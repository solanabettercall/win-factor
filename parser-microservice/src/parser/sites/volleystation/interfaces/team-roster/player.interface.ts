/**
 * Информация об игроке
 */
export interface IPlayer {
  /** Уникальный идентификатор игрока. */
  id: number;

  /** Имя игрока. */
  name: string;

  /** Позиция игрока (например, "Setter", "Libero" и т.п.). */
  position: string;

  /** Игровой номер. */
  number: number;

  /**
   * Ссылка на игрока
   */
  url: string;

  /** Ссылка на фото игрока (если есть). */
  photoUrl: string | null;
}
