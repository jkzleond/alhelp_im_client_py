#!/usr/bin/python
# -*- coding=utf-8 -*-
if __name__ == '__main__':
    from server import sio, app
    #from app import app
    from daemon import runner
    class DaemonApp(object):

        def __init__(self):
            self.stdin_path = '/dev/null'
            self.stdout_path = '/var/log/alhelp-im.log'
            self.stderr_path = '/var/log/alhelp-im-err.log'
            self.pidfile_path =  '/var/run/alhelp-im.pid'
            self.pidfile_timeout = 5

        def run(self):
            sio.run(app, use_reloader=True)
            #app.run()


    daemon_app = DaemonApp()
    daemon_runner = runner.DaemonRunner(daemon_app)
    daemon_runner.do_action()