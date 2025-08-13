import { ConferenceInput } from "../application/conferences/DTO/ConferenceInput";
import { ValidationError } from "../shared/error/ValidationError";
import { IDTOBuilderAndValidator } from "../shared/validator/IFieldsValidator";

export class ConferenceSchemas {
  constructor(
    private conferenceDtoSchemas: IDTOBuilderAndValidator<ConferenceInput>
  ) {}
  public get schemasConferenceDto() {
    return this.conferenceDtoSchemas.defineSchema(
      {
        name: "conference",
        type: "object",
        required: true,
        message: "O conference é obrigatório.",
      },
      {
        name: "email",
        type: "string",
        email: true,
        required: true,
        emailMessage: "email obrigatório",
      }
    );
  }
  public conferenceInputValidator(conferenceInput: ConferenceInput): void {
    try {
      this.schemasConferenceDto.validate(conferenceInput);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else {
        console.error(
          "Um erro inesperado ocorreu na validação:",
          error.message
        );
        throw new Error("Erro inesperado na validação.");
      }
    }
  }
}
