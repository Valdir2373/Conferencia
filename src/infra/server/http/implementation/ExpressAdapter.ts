import express, {
  Express,
  Request,
  Response,
  NextFunction,
  CookieOptions as ExpressCookieOptions,
} from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import path from "path";
import multer from "multer";
import { IMiddlewareHandler } from "../../middleware/interfaces/IMiddlewareHandler";
import { IRequest } from "../../middleware/interfaces/IRequest";
import { IResponse } from "../../middleware/interfaces/IResponse";
import { IServer, HttpMethods } from "../interface/IServer";
import { IFile } from "../../middleware/interfaces/IFile";
import { ICookieOptions } from "../../middleware/interfaces/ICookieOptions";
import { Server } from "http";
import fs from "fs";
import rateLimit from "express-rate-limit";

const UPLOAD_DEST =
  process.env.UPLOAD_DEST || path.join(__dirname, "..", "..", "..", "uploads");
const NODE_ENV = process.env.NODE_ENV || "development";

if (!fs.existsSync(UPLOAD_DEST)) {
  fs.mkdirSync(UPLOAD_DEST, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DEST,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Apenas arquivos PDF são permitidos."
        )
      );
    } else {
      cb(null, true);
    }
  },
});

export class ExpressAdapter implements IServer {
  private app: Express;
  private httpServerInstance: Server | null = null;

  constructor() {
    this.app = express();
    this.app.set("trust proxy", 1);

    // const limiter = rateLimit({
    //   windowMs: 15 * 60 * 1000,
    //   max: 100,
    //   message: JSON.stringify({
    //     message:
    //       "Muitas requisições vindas deste IP, tente novamente após 15 minutos.",
    //   }),
    //   standardHeaders: true,
    //   legacyHeaders: false,
    // });
    // this.app.use(limiter);
    console.log("Rate limiter aplicado.");

    this.app.use(cookieparser());
    const allowedOrigins = [
      "http://localhost:5173",
      "https://stream-server-vava.onrender.com",
      "https://stream-server-vava.onrender.com:443",
    ];

    const ngrokRegex = /\.ngrok-free\.app$/;

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (
            // allowedOrigins.indexOf(origin) !== -1 ||
            // ngrokRegex.test(origin)
            true
          ) {
            return callback(null, true);
          } else {
            console.log(origin);
            const msg =
              "A política de CORS para esta origem não permite acesso.";
            return callback(new Error(msg), false);
          }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
      })
    );

    this.app.use(express.json());
    this.app.use("/js", express.static(path.join(__dirname, "js")));
    this.app.use("/css", express.static(path.join(__dirname, "css")));
    this.app.use(express.static("/css"));
    console.log("ExpressAdapter instanciado");

    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        console.error("Erro na cadeia de handlers:", err);
        if (res.headersSent) {
          return next(err);
        }
        res.status(err.status || 500).json({
          message: err.message || "Erro interno do servidor.",
          error: NODE_ENV === "development" ? err : {},
        });
      }
    );
  }

  eachRequestToAllRoutes(...handlers: IMiddlewareHandler[]): void {
    const expressHandlers = handlers.map((handler) =>
      this.wrapHandler(handler)
    );
    this.app.use(...expressHandlers);
    console.log(`Cada requisição ativada.`);
  }

  getHttpServer(): Server {
    if (!this.httpServerInstance) {
      throw new Error(
        "HTTP Server não foi iniciado ainda. Chame listen() primeiro."
      );
    }
    return this.httpServerInstance;
  }

  multerMiddleware = (
    expressReq: Request,
    expressRes: Response,
    expressNext: NextFunction
  ) => {
    const uploadHandler = upload.single("pdfFile");
    uploadHandler(expressReq, expressRes, (err) => {
      if (err instanceof multer.MulterError) {
        return expressRes
          .status(400)
          .json({ message: "MulterError: " + err.message });
      } else if (err) {
        return expressRes
          .status(500)
          .json({ message: "Erro ao fazer upload do arquivo" });
      }
      expressNext();
    });
  };

  registerFileUploadRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): void {
    const expressHandlers = handlers.map((handler) =>
      this.wrapHandler(handler)
    );

    this.app[methodHTTP as keyof express.Application](
      path,
      this.multerMiddleware,
      ...expressHandlers
    );

    console.log(
      `Rota de upload registrada: ${methodHTTP.toUpperCase()} ${path}`
    );
  }

  async registerRouter(
    methodHTTP: HttpMethods,
    path: string,
    ...handlers: IMiddlewareHandler[]
  ): Promise<void> {
    const expressHandlers = handlers.map((handler) =>
      this.wrapHandler(handler)
    );
    this.app[methodHTTP as keyof express.Application](path, ...expressHandlers);
    console.log(` Rota registrada: ${methodHTTP.toUpperCase()} ${path}`);
  }

  private wrapHandler(
    handler: IMiddlewareHandler
  ): (
    expressReq: Request,
    expressRes: Response,
    expressNext: NextFunction
  ) => void {
    return async (
      expressReq: Request,
      expressRes: Response,
      expressNext: NextFunction
    ) => {
      const ireq: IRequest = {
        body: expressReq.body,
        params: expressReq.params,
        query: expressReq.query,
        headers: expressReq.headers,
        method: expressReq.method,
        path: expressReq.path,
        userPayload: (expressReq as any).userPayload,
        cookies: expressReq.cookies,
        file: (fieldName: string) => {
          if (expressReq.file && expressReq.file.fieldname === fieldName) {
            return {
              fieldname: expressReq.file.fieldname,
              originalname: expressReq.file.originalname,
              encoding: expressReq.file.encoding,
              mimetype: expressReq.file.mimetype,
              destination: expressReq.file.destination,
              filename: expressReq.file.filename,
              path: expressReq.file.path,
              size: expressReq.file.size,
            } as IFile;
          }
          return undefined;
        },
      };

      const ires: IResponse = {
        status: (code: number) => {
          expressRes.status(code);
          return ires;
        },
        json: (data: any) => expressRes.json(data),
        send: (data: any) => expressRes.send(data),
        sendArchive: (data: any) => expressRes.sendFile(data),
        setHeader: (name: string, value: string) => {
          expressRes.setHeader(name, value);
          return ires;
        },
        cookie: (name: string, value: string, options?: ICookieOptions) => {
          const expressOptions: ExpressCookieOptions = { ...options };
          expressRes.cookie(name, value, expressOptions);
          return ires;
        },
        clearCookie: (name: string, options?: ICookieOptions) => {
          const expressOptions: ExpressCookieOptions = { ...options };
          expressRes.clearCookie(name, expressOptions);
          return ires;
        },
        redirect: (url: string) => expressRes.redirect(url),
      };

      const next = (err?: any) => {
        if (err) {
          return expressNext(err);
        }
        expressNext();
      };

      try {
        await handler(ireq, ires, next);
      } catch (error) {
        console.error("Erro capturado no handler do usuário:", error);
        if (!expressRes.headersSent) {
          ires.status((error as any).status || 500).json({
            message:
              (error as any).message ||
              "Erro interno do servidor durante a execução do handler.",
          });
        } else {
          console.error("Erro capturado após headers enviados:", error);
        }
      }
    };
  }

  listen(port: number, callback?: () => void): Server {
    this.httpServerInstance = this.app.listen(port, () => {
      console.log(`Servidor rodando na porta :${port}`);
      if (callback) {
        callback();
      }
    });
    return this.httpServerInstance;
  }
}
