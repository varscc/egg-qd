'use strict';

const validator = require('validator');
// const utility = require('utility');
const Controller = require('egg').Controller;

class SignController extends Controller {

  async showLogin() {
    const { ctx } = this;
    await ctx.render('/sign/signin', { pageTitle: '登录' });
  }

  // sign up
  async showSignup() {
    const { ctx } = this;
    await ctx.render('/sign/signup', { pageTitle: '注册' });
  }

  async signup() {
    const { ctx, service, config } = this;
    const loginname = validator.trim(ctx.request.body.loginname || '').toLowerCase();
    const email = validator.trim(ctx.request.body.email || '').toLowerCase();
    const pass = validator.trim(ctx.request.body.pass || '');
    const rePass = validator.trim(ctx.request.body.re_pass || '');

    let msg;
    // 验证信息的正确性
    if ([ loginname, pass, rePass, email ].some(item => {
      return item === '';
    })) {
      msg = '信息不完整。';
    } else if (loginname.length < 5) {
      msg = '用户名至少需要5个字符。';
    } else if (!ctx.helper.validateId(loginname)) {
      msg = '用户名不合法。';
    } else if (!validator.isEmail(email)) {
      msg = '邮箱不合法。';
    } else if (pass !== rePass) {
      msg = '两次密码输入不一致。';
    }
    // END 验证信息的正确性

    if (msg) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: msg,
        loginname,
        email,
      });
      return;
    }

    const user = await service.user.getUsersByName(loginname);

    if (user) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: '用户名或邮箱已被使用。',
        loginname,
        email,
      });
      return;
    }

    const passhash = ctx.helper.bhash(pass);

    await service.user.newAndSave(loginname, passhash, email);
    // 发送激活邮件
    // await service.mail.sendActiveMail(email, utility.md5(email + passhash + config.session_secret), loginname);
    await ctx.render('sign/signin', {
      // success: '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。',
    });
  }

  async signout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.logout();
    ctx.redirect('/');
  }
}

module.exports = SignController;
