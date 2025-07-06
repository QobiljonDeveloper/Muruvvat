import { Injectable } from "@nestjs/common";
import { Context, Markup, Telegraf } from "telegraf";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { BOT_NAME } from "../app.constants";
import { InjectBot } from "nestjs-telegraf";

const regions = [
  "Toshkent",
  "Andijon",
  "Namangan",
  "Farg'ona",
  "Sirdaryo",
  "Jizzax",
  "Samarqand",
  "Qashqadaryo",
  "Surxondaryo",
  "Buxoro",
  "Navoiy",
  "Xorazm",
  "Qoraqalpog'iston",
];

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async start(ctx: Context) {
    const user_id = ctx.from?.id;
    const startPayload =
      "text" in ctx.message! ? ctx.message.text.split(" ")[1] : undefined;

    let user = await this.botModel.findOne({ where: { user_id } });

    if (!user) {
      user = await this.botModel.create({
        user_id: user_id!,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        last_state: "role",
      });
    }

    if (startPayload === "from_group") {
      await ctx.reply(
        "Siz guruhdan qaytdingiz. Iltimos, kerakli bo‘limni tanlang 👇"
      );
      return this.showMainMenu(ctx, user.role || "sahiy");
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
  }

  async ClickSahiy(ctx: Context) {
    const user_id = ctx.callbackQuery!["data"].split("__")[1];
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user) return ctx.reply("Siz hali ro'yxatdan o'tmagansiz");

    user.role = "sahiy";
    user.last_state = "name";
    await user.save();

    return ctx.reply("Ismingizni kiriting:");
  }

  async ClickSabrli(ctx: Context) {
    const user_id = ctx.callbackQuery!["data"].split("__")[1];
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user) return ctx.reply("Siz hali ro'yxatdan o'tmagansiz");

    user.role = "sabrli";
    user.last_state = "name";
    await user.save();

    return ctx.reply("Ismingizni kiriting:");
  }

  async text(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user || !("text" in ctx.message!)) return;

    const text = ctx.message.text;

    if (user.last_state === "name") {
      user.name = text;
      user.last_state = "phone_number";
      await user.save();

      return ctx.reply(
        "Telefon raqamingizni yuboring",
        Markup.keyboard([
          Markup.button.contactRequest("📞 Kontaktni yuborish"),
        ]).resize()
      );
    }

    if (user.last_state === "district") {
      user.district = text;
      user.last_state = "finish";
      user.status = true;
      await user.save();
      return this.showMainMenu(ctx, user.role);
    }

    if (user.last_state === "location" && text === "O'tkazib yuborish") {
      user.last_state = "finish";
      user.status = true;
      await user.save();
      return this.showMainMenu(ctx, user.role);
    }

    if (text === "Muruvvat qilish") {
      user.last_state = "sadaqa_target";
      await user.save();
      return ctx.reply(
        "Kimga yordam bermoqchisiz? (Masalan: yolg‘iz ona, ehtiyojmand)"
      );
    }

    if (user.last_state === "sadaqa_target") {
      user.sadaqa_target = text;
      user.last_state = "sadaqa_item";
      await user.save();
      return ctx.reply(
        "Nima bermoqchisiz? (Masalan: oziq-ovqat, kiyim-kechak)"
      );
    }

    if (user.last_state === "sadaqa_item") {
      user.sadaqa_item = text;
      user.last_state = "finish";
      await user.save();

      const groupId = "-1002439093163";
      const message = `<b>Yangi muruvvat!</b>\n\n🎁 <b>Nima bermoqchi:</b> ${user.sadaqa_item}`;

      await this.bot.telegram.sendMessage(groupId, message, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Ko'proq ma'lumot",
                url: `https://t.me/${ctx.botInfo.username}?start=from_group`,
              },
            ],
          ],
        },
      });

      return ctx.reply("Muruvvatingiz uchun tashakkur! ✅");
    }
  }

  async contact(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user || !("contact" in ctx.message!)) return;

    const contact = ctx.message.contact;

    if (user.last_state === "phone_number" && contact) {
      user.phone_number = contact.phone_number;

      if (user.role === "sabrli") {
        user.last_state = "region";
        await user.save();

        const buttons = regions.map((r) => [
          Markup.button.callback(r, `region__${r}`),
        ]);

        return ctx.reply(
          "Viloyatingizni tanlang:",
          Markup.inlineKeyboard(buttons)
        );
      } else {
        user.last_state = "location";
        await user.save();

        return ctx.reply(
          "Lokatsiyani yuboring yoki o'tkazib yuboring",
          Markup.keyboard([
            [Markup.button.locationRequest("📍 Lokatsiyani yuborish")],
            ["O'tkazib yuborish"],
          ]).resize()
        );
      }
    }
  }

  async location(ctx: Context) {
    try {
      if (!("location" in ctx.message!)) return;
      const { latitude, longitude } = ctx.message.location;
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({ where: { user_id } });
      if (!user) return;

      const isValid =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        latitude !== 0 &&
        longitude !== 0;
      if (!isValid)
        return ctx.reply("Iltimos, faqat mobil qurilmadan lokatsiya yuboring.");

      if (user.last_state === "location") {
        user.latitude = latitude;
        user.longitude = longitude;
        user.last_state = "finish";
        user.status = true;
        await user.save();
        return this.showMainMenu(ctx, user.role);
      }
    } catch (error) {
      console.error("Location error: ", error);
      await ctx.reply("Xatolik yuz berdi. Qayta urinib ko‘ring.");
    }
  }

  async selectRegion(ctx: Context) {
    const region = ctx.callbackQuery!["data"].split("__")[1];
    const user_id = ctx.from?.id;
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user) return ctx.reply("Siz hali ro'yxatdan o'tmagansiz");

    user.region = region;
    user.last_state = "district";
    await user.save();
    return ctx.reply("Tumaningizni kiriting:");
  }

  async stop(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findOne({ where: { user_id } });
    if (!user) return ctx.reply("Siz avval ro'yxatdan o'tmagansiz");

    user.status = false;
    await user.save();
    return ctx.reply(
      "Botdan chiqdingiz. /start bosing",
      Markup.keyboard([["/start"]]).resize()
    );
  }

  private async showMainMenu(ctx: Context, role: string) {
    const keyboard =
      role === "sahiy"
        ? [
            ["Muruvvat qilish"],
            ["Sabrlilarni ko'rish"],
            ["Admin bilan bog'lanish"],
            ["Sozlamalar"],
            ["Asosiy menyu"],
          ]
        : [
            ["Murojaat qilish"],
            ["Admin bilan bog'lanish"],
            ["Sozlamalar"],
            ["Asosiy menyu"],
          ];

    return ctx.reply(
      "Ro'yxatdan o'tish yakunlandi ✅",
      Markup.keyboard(keyboard).resize()
    );
  }
}
