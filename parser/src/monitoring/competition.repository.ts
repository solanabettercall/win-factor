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

  create(competition: Competition): Observable<Competition> {
    const createdCompetition = new this.competitionModel(competition);
    return from(createdCompetition.save());
  }

  findAll(): Observable<Competition[]> {
    return from(this.competitionModel.find().exec());
  }

  findById(id: number): Observable<Competition | null> {
    return from(this.competitionModel.findOne({ id }).exec());
  }
}
