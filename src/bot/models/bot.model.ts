import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from "sequelize-typescript";

interface IBotCreationAttr {
  user_id: number;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  region?: string;
  district?: string;
  lang?: string;
  name?: string;
  role?: string;
  last_state?: string;
  status?: boolean;
  latitude?: number;
  longitude?: number;
  sadaqa_item?: string;
  sadaqa_targe?: string;
}

@Table({ tableName: "users", timestamps: false })
export class Bot extends Model<Bot, IBotCreationAttr> {
  @PrimaryKey
  @Column({ type: DataType.BIGINT })
  declare user_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare first_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare last_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lang: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare role: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare status: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone_number: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare last_state: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare region: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare district: string;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare latitude: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare longitude: number;

  @Column({ type: DataType.STRING })
  declare sadaqa_target: string;

  @Column({ type: DataType.STRING })
  declare sadaqa_item: string;
}
