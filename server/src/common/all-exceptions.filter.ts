import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { BizError } from './http-error.js'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()
    if (exception instanceof BizError) {
      res.status(exception.status).json({ code: exception.code, message: exception.message })
      return
    }
    const status = exception?.status || exception?.statusCode || 500
    res.status(status).json({
      code: exception?.code || 'INTERNAL',
      message: exception?.message || 'error',
    })
  }
}
