import { Injectable } from '@nestjs/common';
import { bold, fmt, FormattedString, link } from '@grammyjs/parse-mode';
import { Team } from 'src/parser/sites/volleystation/models/team-list/team';
import { Competition } from 'src/monitoring/schemas/competition.schema';

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
}
