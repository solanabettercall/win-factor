import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, map, Observable } from 'rxjs';
import { ITeamRepository } from './interfaces/team-repository.interface';
import { Team, TeamDocument } from './schemas/team.schema';

@Injectable()
export class TeamRepository implements ITeamRepository {
  private readonly logger = new Logger(TeamRepository.name);

  constructor(
    @InjectModel(Team.name)
    private teamModel: Model<TeamDocument>,
  ) {}

  upsert(team: Team): Observable<Team> {
    return from(
      this.teamModel
        .findOneAndUpdate(
          { id: team.id },
          { $set: team },
          { upsert: true, new: true },
        )
        .exec(),
    );
  }

  //   findAll(): Observable<Team[]> {
  //     return from(this.teamModel.find().exec());
  //   }

  //   findById(id: number): Observable<Team | null> {
  //     return from(this.teamModel.findOne({ id }).exec());
  //   }
  // }

  findAll(competitionId: number): Observable<Team[]> {
    return from(
      this.teamModel
        .find()
        .populate({
          path: 'competition',
          match: { id: competitionId },
        })
        .exec(),
    ).pipe(map((teams) => teams.filter((p) => !!p.competition)));
  }

  findById(competitionId: number, id: string): Observable<Team | null> {
    return from(
      this.teamModel
        .findOne({ id })
        .populate({
          path: 'competition',
          match: { id: competitionId },
        })
        .exec(),
    ).pipe(map((team) => (team && team.competition ? team : null)));
  }
}
