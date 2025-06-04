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
      this.competitionModel
        .findOneAndUpdate(
          { id: competition.id }, // условие поиска по уникальному полю
          { $set: competition }, // обновляем все поля
          { upsert: true, new: true }, // new: true → вернуть обновлённый/созданный документ
        )
        .exec(),
    );
  }

  findAll(): Observable<Competition[]> {
    return from(this.competitionModel.find().exec());
  }

  findById(id: number): Observable<Competition | null> {
    return from(this.competitionModel.findOne({ id }).exec());
  }
}
