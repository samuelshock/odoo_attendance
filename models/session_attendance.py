# -*- coding: utf-8 -*-
from odoo import api, fields, models
from datetime import datetime
import pytz

DATETIME_FORMAT = "%Y-%m-%d"


def get_part_of_day(h):
    return (
        "Mañana"
        if 5 <= h <= 11
        else "Tarde"
        if 12 <= h <= 17
        else "Noche"
        if 18 <= h <= 23
        else "Madrugada"
    )


class ReportAttendanceTraceLog(models.Model):
    _name = 'report.attendance.trace.log'

    def _part_of_day(self):
        user = self.env['res.users'].browse(self.env.uid)
        if user.tz:
            tz = pytz.timezone(user.tz) or pytz.utc
            time = pytz.utc.localize(datetime.today()).astimezone(tz)
        else:
            time = datetime.today()
        hour = time.hour
        return get_part_of_day(hour)

    partner_id = fields.Many2one('res.partner', string='Usuario')
    check_in = fields.Datetime(string='Hora de Ingreso', default=datetime.today())
    psa_id = fields.Many2one('session.attendance', string='Molinete de ingreso')
    welcome_message = fields.Boolean(string='Fue saludado', default=False)
    part_of_day = fields.Char(string="Turno", default=_part_of_day)


class PointSessionAttendance(models.Model):
    _name = 'session.attendance'

    name = fields.Char(string='Entrada')
    background_login_image = fields.Many2one('ir.attachment', string='Image')
    background_standby_video = fields.Many2many('ir.attachment', string='Video')

    status_active = fields.Boolean(string='Estado', default=False)
    time_out_to_display = fields.Float(string="Tiempo de espera para mostrar mensaje", default=5.0)
    time_background_interval = fields.Float(string="Intervalo de tiempo entre imagen/video", default=15.0)
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

    def _convert_to_user_hour(self, date):
        user = self.env['res.users'].browse(self.env.uid)
        if user.tz:
            tz = pytz.timezone(user.tz) or pytz.utc
            time = pytz.utc.localize(date).astimezone(tz)
        else:
            time = date
        return time

    def open_standby_screen_page(self):
        videos = [
            {
                'src': "/web/image/ir.attachment/{}/datas".format(v.id),
                'type': v.index_content,
            } for v in self.background_standby_video]
        return {
            'res_model': 'session.attendance',
            'type': 'ir.actions.client',
            'tag': 'standby_action',
            'context': {
                'id': self.id,
                'message': self.message_to_show,
                'time_out_to_display': self.time_out_to_display,
                'time_background_interval': self.time_background_interval,
                'video': videos,
            }
        }

    def search_user(self, text_to_search):
        today = datetime.today()
        today = self._convert_to_user_hour(today)
        users = self.env['res.partner'].search(
            ['|', '|', '|', ('display_name', 'ilike', text_to_search), ('x_user_code', 'ilike', text_to_search),
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
        if qr_vals[-2] != 'profile':
            return False
        qr_id = qr_vals[-1]
        today = datetime.today()
        today = self._convert_to_user_hour(today)
        DATETIME_FORMAT = "%Y-%m-%d"
        user = self.env['res.partner'].search([('x_user_rfid', '=', qr_id)])
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
        today = self._convert_to_user_hour(today)
        pending_notifications = self.env['report.attendance.trace.log'].search(
            [('psa_id', '=', self.id),
             ('welcome_message', '=', False),
             ('check_in', '>=', today.strftime(DATETIME_FORMAT))])

        result = []
        for t_log in pending_notifications:
            item = {
                'id': t_log.id,
                'message': self.message_to_show.format(t_log.partner_id.name) if self.message_to_show.find(
                    '{}') > 0 else self.message_to_show,
            }
            if t_log.partner_id.x_show_profile_image:
                item['image'] = t_log.partner_id.image_1920
            result.append(item)

        return result
