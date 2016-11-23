Imagem Crop
=====================

Requirements
-------------------------------
- jQuery >= 1.11.0 (http://jquery.com/download/)
- jQuery-ui >= 1.11.4 (http://jqueryui.com/download/)

Instalação
-------------------------------
Copie o diretório imgcrop para dentro da pasta do seu projeto.
inclua no html os seguintes arquivos.

1. imgcrop/css/img-crop.css
2. jquery.js
3. imgcrop/js/jquery-ui.min.js
4. imgcrop/js/img-crop.js 

Quick Start
-------------------------------

1. HTMl:
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
                    <form id="myForm" class="formCrop">
                        <div class="form-group text-center">
                            <img src="img/foto.jpg" class="img-responsive retCrop">
                            <!-- a class .openCrop inicia a função -->
                            <!-- botão para adicionar a nova imagem -->
                            <a href="#myForm" class="btn btn-info openCrop pull-right">
                                <i class="glyphicon glyphicon-picture"></i> Alterar Imagem
                            </a>
                            <!-- o botão não precisa estar dentro do formulário -->
                            <!-- basta colocar no href o id do form que contem: cropSize, cropPath -->
                        </div>
                        <div class="hidden">
                            <!-- cropAccept: quais tipos de arquivo são aceitos -->
                            <!-- se nenhum valor for passado default: .jpg,.jpeg,.png  -->
                            <input type="text" name="cropAccept" value=".jpg,.png">

                            <!-- cropSize: o tamanho que a imagem final deve ter -->
                            <!-- dimensões do corte width x height -->
                            <input type="text" name="cropSize"  value="500x150">

                            <!-- cropPath: o caminho de destino onde o arquivo será salvo -->
                            <!-- diretório e nome do arquivo -->
                            <input type="text" name="cropPath"  value="fotos/crop/cortada.png">
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


		
License
-------------------------------
[Included as per request of an user in github]
This is an extension of jQuery UI and shares some code with the existing jQuery UI.
License of jQuery UI might apply to this plugin as well by way of inheritance.

As far as license for this plugin goes, here is the gist:

1. No attribution in any form is needed.
2. I accept no responsibility if this plugin breaks / cause any issue in your project.
3. Do not sell this plugin by itself as a commercial project however you can include this freely as part of any project (commercial or otherwise).
