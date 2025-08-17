import { IJwtUser } from "../../../security/tokens/IJwtUser";
import { IFile } from "./IFile";

interface Cookies {
  refreshToken: string;
  tokenAcess: string;
}

export interface IRequest {
  body: any;
  params: any;
  query: any;
  headers: any;
  method: string;
  path: string;
  userPayload: IJwtUser;
  cookies?: Cookies;
  file: (fieldName: string) => IFile | undefined;
}
