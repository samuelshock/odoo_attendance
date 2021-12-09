# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.http import request
from odoo.exceptions import UserError
from odoo.addons.odoo_attendance.models.qr_code_base import generate_qr_code


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

    x_user_rfid = fields.Char(string="RFID Code")
    x_show_profile_image = fields.Boolean(string="Show profile user?")
    qr_image = fields.Binary(string="QR Code", compute='_generate_qr_code')
    qr_url = fields.Char(string="QR URL", compute='_generate_qr_code')

    def generate_code(self):
        code = self.env['ir.sequence'].sudo().next_by_code('res.partner.rfid.custom')
        if len(self.sudo().search([('x_user_rfid' , '=', code)])) > 0:
            raise UserError('Codigo repetido, por favor verifique o cambie el codigo {} por un codigo valido no '
                            'repetido.'.format(code))
        self.x_user_rfid = code

    def _generate_qr_code(self):
        self.qr_url = ''
        self.qr_image = None
        if self.x_user_rfid:
            base_url = request.env['ir.config_parameter'].get_param('web.base.url')
            base_url += '/user/profile/%s' % self.x_user_rfid
            self.qr_url = base_url
            self.qr_image = generate_qr_code(base_url)
