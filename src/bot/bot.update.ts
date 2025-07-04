import { Controller } from "@nestjs/common";
import { BotService } from "./bot.service";
import { Action, Command, Ctx, On, Start, Update } from "nestjs-telegraf";
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @Action(/^sahiy__+\d+/)
  async onClickSahiy(@Ctx() ctx: Context) {
    await this.botService.ClickSahiy(ctx);
  }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    await this.botService.text(ctx);
  }

  @On("contact")
  async contact(@Ctx() ctx: Context) {
    await this.botService.contact(ctx);
  }

  @Command("stop")
  async onStop(@Ctx() ctx: Context) {
    await this.botService.stop(ctx);
  }
}
