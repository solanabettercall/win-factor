import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICompetitionRepository } from './interfaces/competition-repository.interface';
import { Competition, CompetitionDocument } from './schemas/competition.schema';
import { from, Observable } from 'rxjs';

@Injectable()
export class CompetitionRepository implements ICompetitionRepository {
  private readonly logger = new Logger(CompetitionRepository.name);

  constructor(
    @InjectModel(Competition.name)
    private competitionModel: Model<CompetitionDocument>,
  ) {}

  upsertCompetition(competition: Competition): Observable<Competition> {
    return from(
      (async (): Promise<Competition> => {
        // 1. Ищем по финальному URL
        const existingByUrl = await this.competitionModel
          .findOne({ url: competition.url })
          .exec();

        if (existingByUrl) {
          // Если нашли по URL, объединяем ID: оставляем минимум из двух
          const newId = Math.min(existingByUrl.id, competition.id);

          // Если получилось поменять id, убедимся, что он не конфликтует с другой записью
          if (newId !== existingByUrl.id) {
            // Если вдруг ещё есть документ с newId (но другим URL), его нужно удалить/перезаписать
            // (скорее всего, такой ситуации не возникнет, если данные изначально корректны,
            // но на всякий случай проверим)
            const conflictById = await this.competitionModel
              .findOne({ id: newId, _id: { $ne: existingByUrl._id } })
              .exec();
            if (conflictById) {
              this.logger.warn(
                `Конфликт ID при объединении: документ с id=${newId} уже существует (url=${conflictById.url}). Перезаписываем его.`,
              );
              // Если нужно удалить «конфликтующий» документ и взять его данные, можно сделать так:
              await this.competitionModel
                .deleteOne({ _id: conflictById._id })
                .exec();
            }
            existingByUrl.id = newId;
          }

          // Обновляем остальные поля (имя, url)
          existingByUrl.name = competition.name;
          existingByUrl.url = competition.url; // по сути url не меняется
          await existingByUrl.save();
          return existingByUrl.toObject() as Competition;
        }

        // 2. Если по URL ничего не найдено — пробуем найти по ID
        const existingById = await this.competitionModel
          .findOne({ id: competition.id })
          .exec();

        if (existingById) {
          // Обновляем его название и, возможно, URL (если он изменился)
          existingById.name = competition.name;
          existingById.url = competition.url;
          await existingById.save();
          return existingById.toObject() as Competition;
        }

        // 3. Если ни по URL, ни по ID ничего нет — создаём новую запись
        const created = await this.competitionModel.create(competition);
        return created.toObject() as Competition;
      })(),
    );
  }

  findAll(): Observable<Competition[]> {
    return from(this.competitionModel.find().exec());
  }

  findById(id: number): Observable<Competition | null> {
    return from(this.competitionModel.findOne({ id }).exec());
  }
}
