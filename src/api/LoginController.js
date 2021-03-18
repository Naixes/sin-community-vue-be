import sendEmail from "../config/MailConfig";
import moment from "moment";

class LoginController {
  constructor() {}
  async forget(ctx) {
    const { body } = ctx.request;
    console.log("body", body);
    try {
      // TODO：查询用户是否存在
      let result = await sendEmail({
        code: "1234",
        expire: moment().add(30, "m").format("YYYY-MM-DD HH:mm:ss"),
        email: body.email,
        user: "naixes",
      });
      ctx.body = {
        code: 200,
        data: result,
        msg: "邮件发送成功",
      };
    } catch (error) {
      console.log(error);
    }
  }
}

export default new LoginController();
