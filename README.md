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

+ **Basic**
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
                    <form id="myForm1" class="formCrop">
                        <div class="form-group text-center">
                            <img src="demo/img/logo.png" class="img-responsive retCrop">
                            <a href="#myForm1" class="btn btn-info openCrop">
                                <i class="glyphicon glyphicon-picture"></i> Alterar Imagem
                            </a>
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
Options
-------------------------------
+ **transparent**

So that the final image is saved with transparent background.<br>
CropAccept should be '.png' And the cropPath should end with '.png'
```
<input type="text" name="cropAccept" value=".png">
<input type="text" name="cropPath"  value="foto/imgs/crop.png">
```
para que a imagem final seja salva com fundo transparente.<br>
o cropAccept deve ser '.png' e o cropPath deve terminar com '.png'

Event list
-------------------------------

+ **sending**

Called immediately before each file is sent.<br>
Gets the formData objects as the second parameter, 
So that you can modify it (for example, to change the destination path 'cropPath') or add additional data.

```
$('#myForm').on('sending', function(event, formData) {
    formData.append('cropPath', 'foto/imgs/crop.jpg');
});
```
Chamado imediatamente antes de cada arquivo ser enviado.<br>
Obtém os objetos formData como segundo parâmetro, 
para que você possa modificá-lo (por exemplo, para alterar o caminho de destino 'cropPath') ou adicionar dados adicionais.
	
+ **complete**

Called when the upload is complete, successful or erroneous.<br>
Gets the response from the server as the second argument. 
```
$('#myForm').on('complete', function(event, ret) {
    ret.dir = 'foto/imgs/'; //diretório onde a imagem foi salva
    ret.fileName = 'crop.jpg'; //nome do arquivo
    ret.path = 'foto/imgs/crop.jpg'; //caminho completo da imagem
    ret.status = 'ok ou erro';
    ret.coffin = ''; //em caso de erro, mensagem de erro
});
```
Chamado quando o upload for concluído, com sucesso ou com erro.<br>
Obtém a resposta do servidor como o segundo argumento.

License
-------------------------------
[Included as per request of an user in github]
This is an extension of jQuery UI and shares some code with the existing jQuery UI.
License of jQuery UI might apply to this plugin as well by way of inheritance.

As far as license for this plugin goes, here is the gist:

1. No attribution in any form is needed.
2. I accept no responsibility if this plugin breaks / cause any issue in your project.
3. Do not sell this plugin by itself as a commercial project however you can include this freely as part of any project (commercial or otherwise).
