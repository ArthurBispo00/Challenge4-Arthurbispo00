// src/navigation/types.ts

// Tipos para o seu menu principal (Drawer)
export type DrawerParamList = {
  Home: undefined;
  OperacoesPorPlaca: undefined;
  CadastrarVeiculo: { veiculo?: any } | undefined;
  ListarVeiculos: undefined;
  MapaDoPatio: { plate?: string } | undefined;
  RadarProximidade: { plate?: string; tag?: string } | undefined;
  Sobre: undefined;
};

// Tipos para a sua navegação de Login/Cadastro (Stack)
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};