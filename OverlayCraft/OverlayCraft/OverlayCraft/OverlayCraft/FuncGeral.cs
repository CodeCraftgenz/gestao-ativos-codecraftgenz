/*****************************************************
 *          Nome: FuncGeral
 *          Obs.: Representa a classe de funções Gerais. 
 *   Dt. Criação: 03/03/2024
 * Dt. Alteração: --
 *    Criada por: Monstro (mFacine)
 ****************************************************/
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace OverlayCraft
{
    public class FuncGeral
    {
        #region Crypto
        /// <SUMMARY>
        /// Vetor de byte utilizados para a criptografia (chave externa)
        /// </SUMMARY>
        private static byte[] bIV = { 0x50, 0x08, 0xF1, 0xDD, 0xDE, 0x3C, 0xF2, 0x18, 0x44, 0x74, 0x19, 0x2C, 0x53, 0x49, 0xAB, 0xBC };

        /// <summary>
        /// Representação de valor em base 64 (chave interna)
        /// O valor represanta a transformação para base64 de 
        /// um conjunto de 32 caracteres (8 * 32 - 256 bits)
        /// a chave é: "Criptografia com Rijndael / AES"
        /// </summary>
        private const string cryptoKey = "Q3JpcHRvZ3JhZmlhcyBjb20gUmluamRhZWwgLyBBRVM=";
 
        /***********************************************************************
        * NOME:            Criptografa        
        * METODO:          Criptografa o Password do usuário e retorna o 
        *                   Password criptografado
        * PARAMETRO:       String sPassWord
        * DT CRIAÇÃO:      03/03/2024    
        * DT ALTERAÇÃO:    -
        * ESCRITA POR:     Monstro (mFacine) 
        ***********************************************************************/
        public string Criptografa(string sPassWord)
        {

            try
            {
                //(27/05/2019-mfacine) Se a string não está vazia, executa a criptografia
                if (!string.IsNullOrEmpty(sPassWord))
                {
                    //(27/05/2019-mfacine) Cria instancias de vetores de bytes com as chaves                
                    byte[] bKey = Convert.FromBase64String(cryptoKey);
                    byte[] bText = new UTF8Encoding().GetBytes(sPassWord);

                    //(27/05/2019-mfacine) Instancia a classe de criptografia Rijndael
                    Rijndael rijndael = new RijndaelManaged();

                    //(27 / 05 / 2019 - mfacine)
                    // Define o tamanho da chave "256 = 8 * 32"                
                    // Lembre-se: chaves possíves:                
                    // 128 (16 caracteres), 192 (24 caracteres) e 256 (32 caracteres)                
                    rijndael.KeySize = 256;

                    //(27 / 05 / 2019 - mfacine)
                    // Cria o espaço de memória para guardar o valor criptografado:                
                    MemoryStream mStream = new MemoryStream();
                    // Instancia o encriptador                 
                    CryptoStream encryptor = new CryptoStream(
                        mStream,
                        rijndael.CreateEncryptor(bKey, bIV),
                        CryptoStreamMode.Write);

                    // Faz a escrita dos dados criptografados no espaço de memória
                    encryptor.Write(bText, 0, bText.Length);
                    // Despeja toda a memória.                
                    encryptor.FlushFinalBlock();
                    // Pega o vetor de bytes da memória e gera a string criptografada                
                    return Convert.ToBase64String(mStream.ToArray());
                }
                else
                {
                    //(27/05/2019-mfacine) Se a string for vazia retorna nulo                
                    return null;
                }
            }
            catch (Exception ex)
            {
                //(27/05/2019-mfacine) Se algum erro ocorrer, dispara a exceção            
                throw new ApplicationException("Erro ao criptografar", ex);
            }
        }
    }
    #endregion
}