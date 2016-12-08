Imagem Crop
=====================

Requirements
-------------------------------
- jQuery >= 1.11.0 (http://jquery.com/download/)
- jQuery-ui >= 1.11.4 (http://jqueryui.com/download/)

Installation
-------------------------------
Copy the imgcrop directory into the folder of your project.
Include non html the following files.

+ Include `imgcrop/css/img-crop.css`
+ Include `https://code.jquery.com/jquery-3.1.1.min.js`
+ Include `imgcrop/js/jquery-ui.js`
+ Include `imgcrop/js/img-crop.js`

Quick Start
-------------------------------

HTMl:
```
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Imagem Crop</title>

        <link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" type="text/css" href="libs/imgcrop/css/img-crop.css">
    </head>
    <body>
        <div class="container">
            <div class="row">
                <div class="col-xs-12 col-md-6 col-md-offset-3">
                    <form id="myForm" class="formiCrop">
                        <div class="form-group text-center">
                            <img src="demo/img/logo.png" class="img-responsive retCrop">
                            <a href="#" class="btn btn-info openCrop">Alterar Imagem</a>
                        </div>
                        <div class="hidden">
                            <input type="file" name="inputFile" accept="image/.png">
                            <input type="text" name="sizecut" value="500x150">
                            <input type="text" name="filePath" value="foto/imgs/logo.png">
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <script type="text/javascript" src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
        <script type="text/javascript" src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
        <script type="text/javascript" src="libs/imgcrop/js/jquery-ui.js"></script>
        <script type="text/javascript" src="libs/imgcrop/js/img-crop.js"></script>
    </body>
</html>
```

+ **Basic**
```
<form id="myForm" class="formiCrop">
    <div class="form-group text-center">
        <label>Redimensionar Imagem </label>
        <a href="demo/img/img.jpg" class="retCrop">
            <img src="demo/img/img.jpg" class="img-responsive">
        </a>
        <a href="#myForm" class="btn btn-info openFile">Alterar Imagem</a>
        <a href="#" class="btn btn-primary fcSubmit">Salvar</a>
    </div>
    <div class="hidden">
        <input type="file" name="inputFile" accept="image/*">
        <input type="text" name="sizecut" value="813x538">
        <input type="text" name="filePath" value="foto/imgs/crop.jpg">
    </div>
</form>
```

+ **Show Crop**
```
<form id="myForm" class="formiCrop">
    <div class="form-group text-center">
        <label>Imagem pgn com fundo transparente</label>
        <img src="demo/img/logo.png" class="img-responsive retCrop">
        <!-- a class .openCrop inicia a função -->
        <a href="#" class="btn btn-info openCrop">Alterar Imagem</a>
    </div>
    <div class="hidden">
        <input type="file" name="inputFile" accept="image/.png">
        <!-- sizecut: o tamanho que a imagem final deve ter -->
        <!-- dimensões do corte width x height -->
        <input type="text" name="sizecut" value="500x150">

        <!-- filePath: o caminho de destino onde o arquivo será salvo -->
        <!-- diretório e nome do arquivo -->
        <input type="text" name="filePath" value="foto/imgs/logo.png">
    </div>
</form>
```


Options
-------------------------------
```
$('#myForm').icrop({
    accept: null, // extensões aceitas
    autosend: null, // enviar automaticamente
    
    filePath: null, // caminho completo da nova imagem
    sizecut: null, // dimensões da nova imagem
    sizetmb: null, // dimensões da thumbnail
    seloPath: null, // caminho completo do selo
    seloFix: null // Posição onde o selo deve ser fixado

    multiple: null, // multiplas imagens
    maxfiles: null, // limitar a quantidade de imagem
    qntfiles: 0, // quantidade de imagem já adicionadas
    //
    showcrop: null, // exibir a imagem para selecionar a área de corte
    showsize: null, // mostrar no form a opção de redimensionar
    fixRatio: null, // manter aspectRatio
});
```

accept: null, // extensões aceitas, default = '.jpg,.jpeg,.png'
    filePath: null, // caminho completo da nova imagem
    autosend: null, // enviar automaticamente após carregar a imagem

    multiple: null, // multiplas imagem?, se null pega a informção input file
    maxfiles: null, // limitar a quantidade de imagem
    qntfiles: 0, // quantidade de imagem já adicionadas
    //
    showsize: null, // mostrar no form a opção de redimensionar
    showcrop: null, // se false redimenciona direto, sem exibir a área de seleção 
    fixRatio: null, // manter aspectRatio, null = fica a criterio do usuario
    sizecut: null, // tamanho que a imagem deve ser salva
    sizetmb: null, // tamanho que o thumbnail deve ser salvo
    seloPath: null, // caminho completo do selo
    seloFix: null // Posição onde o selo deve ser fixado

se o valor for == null, busca a informação no form, ex:<br>
se accept: null, pega o accept do input file

transparent
-------------------------------
Para que a imagem final seja salva com fundo transparente.<br>
o accept deve ser '.png' e o cropPath deve terminar com '.png'
```
<form id="myForm" class="formiCrop">
    <div class="hidden">
        <input type="file" name="inputFile" accept="image/.png">
        <input type="text" name="cropPath"  value="foto/imgs/crop.png">
    </div>
</form>

/* ou */

$('#myForm').icrop({
    accept: '.png',
    cropPath: 'foto/imgs/crop.png' 
});
```


Event list
==================================

started
-------------------------------
Chamado imediatamente após iniciado.
```
$('#myForm').on('started', function(event) {
    // ...
});
```

fileadd
-------------------------------
Chamado imediatamente após cada imagem ser carregada.<br>
Obtém o objeto file como parâmetro

```
$('#myForm').on('fileadd', function(event, file) {
     // ...
});
```

fileremoved
-------------------------------
Chamado imediatamente após cada imagem ser removida.<br>
Obtém o objeto file como parâmetro.

```
$('#myForm').on('fileremoved', function(event, file) {
     // ...
});
```

sending
-------------------------------
Chamado antes que  o arquivo seja enviado<br>
Obtém o objeto formData como parâmetro, 
para que possa ser modificado, por exemplo:<br>
para alterar o caminho de destino 'cropPath',
o tamanho que a imagem deve ser salva 'sizecut',
o tamanho que o thumbnail deve ser salvo 'sizetmb',
ou outros dados adicionais.
```
$('#myForm').on('sending', function(event, formData) {
    formData.append('cropPath', 'foto/imgs/crop.jpg');
});
```

fileprogress
-------------------------------
chamado sempre que o progresso do upload mudar, parâmetros file e progs<br>
progs: o progresso em porcentagem (0-100)
```
$('#myForm').on('fileprogress', function(event, file, progs) {
   console.log(file.name, progs+'%');
});
```

success
-------------------------------
Chamado quando o upload for concluído, com sucesso ou com erro.<br>
Obtém como parâmetros file e retorno<br>
retorno: resposta do servidor com os dados da nova imagem.
```
$('#myForm').on('success', function(event, file, retorno) {
    retorno = {
        // caminho da nova imagem
        path: "foto/galeria/img/foto.jpg",
    
        // thumbnail for definido, caminho da thumbnail
        tmb: "foto/galeria/tmb/foto.jpg" || "",

        // se a imagem enviada e o destino são válidos
        stts: true,

        // status do retorno "ok" ou "erro"
        status: "ok",

        // mensagem em caso de erro
        coffin: "",

        // diretório real onde a imagem foi salva
        dir: "../../foto/galeria/img/",

        // path real da nova imagem
        dirPath: "../../foto/galeria/img/foto.jpg"
    }
    file: {
        name: "imagem.jpg"
        preview: "div.ic-preview.ic-image-preview"
        size: 249971,
        status: "success",
        type: "image/jpeg"
    }
});
```

Multiplus Arquivos
-------------------------------
se multiple === true;

filesadded
-------------------------------
chamado após todas as imagens serem carregadas<br>
Obtém como parâmetros vFile: array com todos os objetos file
```
$('#myForm').on('filesadded', function(event, vFile) {
   console.log(vFile.length);
});
```

+ **filesremoved**
chamado após todas as imagens serem removidas

+ **complete**
chamado após todas as imagens serem salvas


License
-------------------------------
[Included as per request of an user in github]
This is an extension of jQuery UI and shares some code with the existing jQuery UI.
License of jQuery UI might apply to this plugin as well by way of inheritance.

As far as license for this plugin goes, here is the gist:

1. No attribution in any form is needed.
2. I accept no responsibility if this plugin breaks / cause any issue in your project.
3. Do not sell this plugin by itself as a commercial project however you can include this freely as part of any project (commercial or otherwise).
