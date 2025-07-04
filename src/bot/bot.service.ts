import { Injectable } from "@nestjs/common";
import { Context, Markup, Telegraf } from "telegraf";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { BOT_NAME } from "../app.constants";
import { Ctx, InjectBot } from "nestjs-telegraf";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async start(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id: String(user_id) },
      });

      if (!user) {
        await this.botModel.create({
          user_id: ctx.from?.id!,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          last_state: "role",
        });
      }

      await ctx.reply(
        "Qaysi ro'ldan ro'yxatdan o'tmoqchisiz?",
        Markup.inlineKeyboard([
          [
            Markup.button.callback("Sahiy", `sahiy__${user_id}`),
            Markup.button.callback("Sabrli", `sabrli__${user_id}`),
          ],
        ])
      );
    } catch (error) {
      console.log("Error on Start: ", error);
    }
  }

  async ClickSahiy(ctx: Context) {
    try {
      const user_id = ctx.callbackQuery!["data"].split("__")[1];
      const user = await Bot.findOne({ where: { user_id } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        user.role = "sahiy";
        user.last_state = "name";
        await user.save();
        ctx.reply("Ismingizni kiriting:");
      }
    } catch (error) {
      console.log("Error on Click Sahiy", error);
    }
  }

  async text(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if (user.last_state == "name") {
          if ("text" in ctx.msg) {
            user.name = ctx.msg.text;
            user.last_state = "phone_number";
            await user.save();

            ctx.reply("Telefon raqamingizni yuboring", {
              ...Markup.keyboard([
                Markup.button.contactRequest("Contactni ulashish"),
              ]).resize(),
            });
          }
        }
      }
    } catch (error) {
      console.log("Error on Text", error);
    }
  }

  async contact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if (user.last_state == "phone_number") {
          if ("contact" in ctx.msg) {
            user.phone_number = ctx.msg.contact.phone_number;
            user.last_state = "location";
            await user.save();
            ctx.reply(
              "Manzilingizni kiriting:",
              Markup.keyboard(["O'tkazib yuborish"]).resize()
            );
          }
        }
      }
    } catch (error) {
      console.log("Error on Contact", error);
    }
  }

  async stop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id: String(user_id) },
      });

      if (!user) {
        await ctx.replyWithHTML(`Siz avval ro'yxattan o'tmagansiz`, {
          ...Markup.removeKeyboard(),
        });
      } else if (user.status) {
        user.status = false;
        await user.save();

        await ctx.replyWithHTML(
          `Siz vaqtincha botdan chiqib ketdingiz. Qayta faollashtirish uchun /start tugmasini bosing!`,
          {
            ...Markup.keyboard([["/start"]]).resize(),
          }
        );
      }
    } catch (error) {
      console.log(`❌ Error on Stop: `, error);
    }
  }
}
