// src/bot/models/bot.model.ts

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
  lang?: string;
  name?: string;
  role?: string;
  last_state?: string;
  status?: boolean;
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
}
