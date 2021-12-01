# -*- coding: utf-8 -*-
from odoo import api, fields, models
from datetime import datetime

DATETIME_FORMAT = "%Y-%m-%d"


class ReportAttendanceTraceLog(models.Model):
    _name = 'report.attendance.trace.log'

    partner_id = fields.Many2one('res.partner', string='Usuario')
    check_in = fields.Datetime(string='Hora de Ingreso', default=datetime.today())
    psa_id = fields.Many2one('session.attendance', string='Molinete de ingreso')
    welcome_message = fields.Boolean(string='Fue saludado', default=False)


class PointSessionAttendance(models.Model):
    _name = 'session.attendance'

    name = fields.Char(string='Entrada')
    background_login_image = fields.Many2one('ir.attachment', string='Image')
    background_standby_video = fields.Many2one('ir.attachment', string='Video')
    status_active = fields.Boolean(string='Estado', default=False)
    time_out_to_display = fields.Float(string="Tiempo de espera para mostrar mensaje", default=5.0)
    message_to_show = fields.Char(string='Mensaje a mostrar')

    def open_check_in_page(self):
        return {
            'res_model': 'session.attendance',
            'type': 'ir.actions.client',
            'tag': 'check_in_action',
            'context': {
                'id': self.id,
                'image': self.background_login_image.image_src,
            }
        }

    def open_standby_screen_page(self):
        return {
            'res_model': 'session.attendance',
            'type': 'ir.actions.client',
            'tag': 'standby_action',
            'context': {
                'id': self.id,
                'message': self.message_to_show,
                'time_out_to_display': self.time_out_to_display,
                'video': "/web/image/ir.attachment/{}/datas".format(self.background_standby_video.id),
            }
        }

    def search_user(self, text_to_search):
        today = datetime.today()
        users = self.env['res.partner'].search(
            ['|', '|', ('x_user_code', 'ilike', text_to_search),
             ('mobile', 'ilike', text_to_search),
             ('vat', 'ilike', text_to_search)])
        users_logged = self.env['report.attendance.trace.log'].search([
            ('partner_id', 'in', users.ids),
            ('check_in', '>=', today.strftime(DATETIME_FORMAT))])
        return [
            {
                'id': u.id,
                'name': u.name,
                'image': u.image_1920,
                'vat': u.vat,
                'x_user_code': u.x_user_code,
                'x_user_type': u.x_user_type
            } for u in users if u.id not in users_logged.partner_id.ids]

    def search_user_qr(self, qr_text):
        qr_vals = qr_text.split('/')
        if len(qr_vals) < 2:
            return False
        if qr_vals[-2] != 'user':
            return False
        qr_id = qr_vals[-1]
        today = datetime.today()
        DATETIME_FORMAT = "%Y-%m-%d"
        user = self.env['res.partner'].search([('id', '=', qr_id)])
        if user:
            user_logged = self.env['report.attendance.trace.log'].search(
                [('partner_id', '=', user.id), ('check_in', '>=', today.strftime(DATETIME_FORMAT))])
            return {
                'id': user.id,
                'name': user.name,
                'user_logged': True if user_logged else False,
            }
        return False

    def get_notifications(self):
        today = datetime.today()
        pending_notifications = self.env['report.attendance.trace.log'].search(
            [('psa_id', '=', self.id),
             ('welcome_message', '=', False),
             ('check_in', '>=', today.strftime(DATETIME_FORMAT))])

        return [{
            'id': t_log.id,
            'message': self.message_to_show.format(t_log.partner_id.name) if self.message_to_show.find('{}') > 0 else self.message_to_show,
        } for t_log in pending_notifications]
