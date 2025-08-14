import { IJwtUser } from "../../../security/interfaces/IJwtUser";
import { IFile } from "./IFile";

export interface IRequest {
  body: any;
  params: any;
  query: any;
  headers: any;
  method: string;
  path: string;
  userPayload?: IJwtUser;
  cookies?: { [key: string]: string };
  file: (fieldName: string) => IFile | undefined;
}
