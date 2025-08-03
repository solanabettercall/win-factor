import { Injectable } from '@nestjs/common';
import { bold, fmt, FormattedString, link } from '@grammyjs/parse-mode';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { Competition } from 'src/monitoring/schemas/competition.schema';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { PlayerWithStatistic } from 'src/match-watcher/match-watcher.service.service';

@Injectable()
export class FormattingService {
  mainMenuTitle(): FormattedString {
    return fmt`🏐 ${bold('Мониторинг игроков')}\n\nВыбери действие из меню ниже ⬇️`;
  }

  allCompetitionsTitle(): FormattedString {
    return fmt`🏆 ${bold('Соревнования')}\n\nВыбери турнир ⬇️`;
  }

  allCompetitionsButton(): string {
    return fmt`🏆 ${bold('Cоревнования')}`.text;
  }

  competitionTitle(competition: Competition): FormattedString {
    return fmt`🏆 ${link(competition.name, competition.url)}\n\nВыбери команду ⬇️`;
  }

  teamTitle(competition: Competition, team: Team): FormattedString {
    return fmt`🏆 ${bold(competition.name)}\n👥 ${bold(team.name)}\n\nВыбери игрока ⬇️`;
  }

  monitoredCompetitionsTitle(): FormattedString {
    return fmt`📡 ${bold('Мониторинг')}\n\nВыбери турнир ⬇️`;
  }

  monitoredCompetitionsButton(): string {
    return fmt`📡 ${bold('Мониторинг')}`.text;
  }

  monitoredCompetitionTitle(competition: Competition): FormattedString {
    return fmt`📊 ${bold('Мониторинг')}\n🏆 ${bold(competition.name)}\n\nВыбери команду ⬇️`;
  }

  backButtonText(): string {
    return '⬅️ Назад';
  }

  homeButtonText(): string {
    return '🏠 Меню';
  }

  allPlayersButtonText(): string {
    return '📋 Все игроки';
  }

  monitoredButtonText(): string {
    return '📡 Текущий мониторинг';
  }

  statisticsCompetitionsTitle(): FormattedString {
    return fmt`📊 ${bold('Статистика')}\n\nВыбери турнир ⬇️`;
  }

  statisticsCompetitionsButton(): string {
    return fmt`📊 ${bold('Статистика')}`.text;
  }

  statisticsCompetitionTitle(competition: Competition): FormattedString {
    return fmt`📊 ${bold('Статистика')}\n🏆 ${bold(competition.name)}\n\nВыбери команду ⬇️`;
  }

  statisticsTeamTitle(competition: Competition, team: Team): FormattedString {
    return fmt`📊 ${bold('Статистика команды')}\n🏆 ${bold(competition.name)}\n👥 ${bold(team.name)}\n\nСтатистика всех игроков:`;
  }

  formatTeamStatistics(
    competition: Competition,
    team: Team,
    teamRoster: TeamRoster & { players: PlayerWithStatistic[] },
  ): { text: string; parse_mode: 'HTML' } {
    const formatPosition = (position: string): string => {
      switch (position) {
        case 'middle blocker':
          return 'MB';
        case 'setter':
          return 'S';
        case 'outside hitter':
          return 'WS';
        case 'blocker':
          return 'B';
        case 'opposite':
          return 'O';
        case 'libero':
          return 'L';
        default:
          return position;
      }
    };

    // Сортируем игроков
    const sortedPlayers = [...teamRoster.players].sort((a, b) => {
      const aHasRating = a.statistic?.pointsScored && a.statistic?.setsPlayed;
      const bHasRating = b.statistic?.pointsScored && b.statistic?.setsPlayed;
      const aHasPoints = a.statistic?.pointsScored;
      const bHasPoints = b.statistic?.pointsScored;

      // 1. Если есть рейтинг (очки и сеты) - сортируем по рейтингу
      if (aHasRating && bHasRating) {
        const aRating = a.statistic!.pointsScored! / a.statistic!.setsPlayed!;
        const bRating = b.statistic!.pointsScored! / b.statistic!.setsPlayed!;
        return bRating - aRating;
      }

      // 2. Игроки с рейтингом выше чем с одними очками
      if (aHasRating && !bHasRating) return -1;
      if (!aHasRating && bHasRating) return 1;

      // 3. Если только очки - сортируем по очкам
      if (aHasPoints && bHasPoints) {
        return b.statistic!.pointsScored! - a.statistic!.pointsScored!;
      }

      // 4. Игроки с очками выше чем без статистики
      if (aHasPoints && !bHasPoints) return -1;
      if (!aHasPoints && bHasPoints) return 1;

      // 5. Остальные по номеру
      return a.number - b.number;
    });

    const lines = [
      `📊 <b>Статистика команды</b>`,
      `🏆 <b>${competition.name}</b>`,
      `👥 <b>${team.name}</b>`,
      '',
    ];

    for (const player of sortedPlayers) {
      let playerLine = `[${player.number}] <b>${player.name}</b> (${formatPosition(player.position)})`;

      if (
        player.statistic?.pointsScored > 0 &&
        player.statistic?.setsPlayed > 0
      ) {
        const rating = (
          player.statistic.pointsScored / player.statistic.setsPlayed || 0
        ).toFixed(2);
        playerLine += `\n⭐️ <b>${rating}</b> (${player.statistic.pointsScored}/${player.statistic.setsPlayed})`;
      } else if (player.statistic?.pointsScored > 0) {
        playerLine += `\n⭐️ <b>${player.statistic?.pointsScored}</b>`;
      }

      lines.push(playerLine);
    }

    return {
      text: lines.join('\n'),
      parse_mode: 'HTML',
    };
  }
}
