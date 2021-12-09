# -*- coding: utf-8 -*-
{
    'name': "Odoo Attendance",
    'version': "1",
    'author': "Samuel | Andres",
    'category': "Custom",
    'summary': "Modulo de control de entradas y saludos a clientes con tickets.",
    'website': "https://www.samuel_andres.net/",
    'description': """
        - personalizado
    """,
    'depends': ['base', 'web', 'bus', 'account'],
    'data': [
        'security/ir.model.access.csv',
        'data/sequence.xml',
        'views/assets.xml',
        'views/user_profile_templates.xml',
        'views/attendance_report_view.xml',
        'views/res_partner.xml',
        'views/attendance_view.xml',
        'report/res_partner_templates.xml',
        'report/res_partner_report_view.xml',
    ],
    'qweb': [
        'static/src/xml/attendance_templates.xml',
    ],
    'images': ['static/description/icon.png'],
    'demo': [], 
    'installable': True,
    'application': True,
    'auto_install': False,
}
