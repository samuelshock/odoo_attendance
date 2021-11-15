# -*- coding: utf-8 -*-
from odoo import api, fields, models


class AttendanceResPartner(models.Model):
    _inherit = 'res.partner'

    x_identity_card = fields.Char(string="Identity card")
    x_user_code = fields.Char(string="User code")
    x_user_type = fields.Selection([
        ('vip', 'Vip'),
        ('vip2', 'Vip 2'),
        ('vipn', 'Vip n'),
        ('client', 'Client'),
        ('locked', 'Locked')
    ], "Type of user")
    x_user_type_color = fields.Selection([
        ('code_color', 'Code color'),
        ('code_colorn', 'Code color n'),
    ], "User Type Color")

    def send_message(self):
        user = self.env['res.users'].search([('id','=',6)])
        user.notify_success(message='My success message')