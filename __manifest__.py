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
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/res_partner.xml',
        'views/attendance_view.xml',
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
