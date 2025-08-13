// import { UserInputDTO } from "../../application/users/DTO/UserInput";
// import { UserOutputDTO } from "../../application/users/DTO/UserOutput";
// import { UsersService } from "../../infra/service/UsersService";
// import { UserRepository } from "../../infra/repository/UsersRepository";
// import { ConfigEnv } from "../../config/Config.env";
// import { MongooseDataAccess } from "../../infra/database/MoongoseDataAcess";
// import { MongooseHandler } from "../../infra/database/MongooseHandler";
// import mongoose from "mongoose";
// import { ConfigDB } from "../../config/ConfigDB";

// let dbHandler: MongooseHandler;
// let dataAcess: MongooseDataAccess;
// let usersRepository: UserRepository;
// let usersService: UsersService;
// let idUser: string = "";
// let emailUser: string = "";

// const userTemplate = {
//   username: "",
//   useremail: "",
//   userpassword: "vava3146",
// };

// describe("Aqui está todos os testes, da service, dos usuarios: ", () => {
//   beforeAll(async () => {
//     const dbConfig = new ConfigDB();
//     const url = dbConfig.getConfigDB();

//     dbHandler = new MongooseHandler(url);
//     dataAcess = new MongooseDataAccess(dbHandler);
//     usersRepository = new UserRepository(dataAcess);
//     usersService = new UsersService(usersRepository);

//     await dbHandler.getConnection();
//     try {
//       await mongoose.connection.collection("users").deleteMany({});
//       console.log("Coleção 'users' limpa antes dos testes.");
//     } catch (error) {
//       console.error("Erro ao limpar a coleção 'users':", error);
//     }
//   });

//   afterAll(async () => {
//     if (dbHandler) {
//       await dbHandler.closePool();
//     }
//     if (mongoose.connection.readyState !== 0) {
//       await mongoose.disconnect();
//       console.log("Mongoose desconectado forçosamente no afterAll.");
//     }
//   });

//   beforeEach(async () => {
//     const timestamp = Date.now();

//     userTemplate.useremail = `test_user_vavateste123@example.com`;
//     userTemplate.username = `user_vavateste123`;
//   });

//   it("Deve criar um usuario: ", async () => {
//     const newUser: UserOutputDTO | string = await usersService.createNewUser(
//       userTemplate
//     );

//     console.log("Retorno de createNewUser:", newUser);

//     if (typeof newUser === "string") {
//       expect(newUser).not.toContain("Usuário com este email já existe.");
//       fail(`Falha inesperada na criação do usuário: ${newUser}`);
//     } else {
//       expect(typeof newUser.id).toBe("string");
//       idUser = newUser.id;
//       expect(newUser.email).toBeDefined();
//       emailUser = newUser.email;
//       console.log(newUser);

//       expect(newUser.username.length).toBeGreaterThanOrEqual(5);
//       expect(newUser.username.length).toBeLessThanOrEqual(20);
//     }
//   });

//   it("Deve pegar, o usuario, pela id: ", async () => {
//     expect(idUser).not.toBe("");
//     const userById: UserOutputDTO | undefined = await usersService.getByIdUser(
//       idUser
//     );
//     expect(userById).toBeDefined();
//     expect(userById?.id).toBe(idUser);
//   });

//   it("Deve pegar, um usuario, pelo email: ", async () => {
//     expect(emailUser).not.toBe("");
//     const userByEmail: UserOutputDTO | undefined =
//       await usersService.getByEmailUser(emailUser);
//     expect(userByEmail).toBeDefined();
//     expect(userByEmail?.email).toBe(emailUser);
//   });

//   it("Deve pegar, todos os, usuarios: ", async () => {
//     const allUsers: UserOutputDTO[] | undefined =
//       await usersService.getAllUsers();
//     expect(allUsers).toBeDefined();
//     expect(Array.isArray(allUsers)).toBe(true);

//     expect(allUsers!.length).toBeGreaterThan(0);
//   });

//   it("deve fazer login no usuario", async () => {
//     expect(userTemplate.useremail).not.toBe("");
//     console.log(userTemplate);

//     const response = await usersService.loginUserService(userTemplate);
//     expect(response).toBeDefined();
//   });

//   it("deve atualizar um usuario pelo email: ", async () => {
//     expect(emailUser).not.toBe("");
//     const userToUpdate: UserInputDTO = {
//       useremail: emailUser,
//       username: "updated_user_name",
//       userpassword: "novaSenhaForte!",
//     };
//     const userUpdated = await usersService.updateUserByEmail(userToUpdate);
//     console.log(userUpdated);

//     expect(userUpdated).toBeDefined();
//     if (!userUpdated) return;

//     expect(userUpdated.username).toBe("updated_user_name");
//     expect(userUpdated.email).toBe(emailUser);
//   });

//   it("deve deletar, um usuario, pela id: ", async () => {
//     expect(idUser).not.toBe("");
//     const response = await usersService.deleteUser(idUser);

//     expect(response).toBeDefined();
//     expect(response.message).toBe("usuario deletado");

//     const deletedUser = await usersService.deleteUser(idUser);
//     expect(deletedUser).toBeUndefined();
//   });
// });
