import svgCaptcha from "svg-captcha";

class PublicController {
  constructor() {}
  async getCaptcha(ctx) {
    const newCaptcha = svgCaptcha.create({
      size: 5,
      ignoreChars: "0o1il",
      color: true,
      noise: Math.floor(Math.random() * 5),
      width: 150,
      height: 38,
    });
    ctx.body = {
      code: 200,
      // newCaptcha.text，验证码内容
      data: newCaptcha.data,
    };
  }
}

export default new PublicController();
