<?php

/**
 * Description of imgCrop
 *
 * @author granhani
 */
class iCrop {

    // arquivos
    private $origem, $flPost, $img, $nova, $imgNew;
    private $extValid = array('jpg', 'jpeg', 'jpe', 'gif', 'bmp', 'png');
    private $formato, $ext, $tamanho, $arquivo, $diretorio;
    //
    // dimensoes
    public $largura, $altura, $dirPath;
    private $nova_largura, $nova_altura, $tamanho_html, $selo;
    private $posicao_crop, $stts = FALSE, $status, $coffin = '';
    //
    // cor de fundo para preenchimento
    private $rgb = 255, $bg;

    public function retCrop($fim = NULL, $vNot = '') {
        if (is_string($fim) && empty($vNot)) {
            $vNot = $fim;
            $fim = NULL;
        }
        if ($fim) {
            $this->set_status();
            $this->imageDestroy($this->img);
        }
        if ($fim === 1) {
            $vRet = array('dirPath' => $this->dirPath, 'stts' => $this->stts, 'status' => $this->status, 'coffin' => $this->coffin);
        } else {
            $vNot = explode(',', (empty($vNot) ? '' : "$vNot,") . "formato,tamanho_html,origem,img,nova,rgb,posicao_crop,extValid");
            $vRet = array_diff_key(get_object_vars($this), array_flip($vNot));
        }
        return (object) $vRet;
    }

    function __construct($origem = NULL, $extValid = NULL, $rgb = NULL) {
        $this->set_extValid($extValid);
        $this->set_rgb($rgb);
        $this->imgNew = FALSE;
        if (!is_null($origem)) {
            $this->carrega($origem);
        }
    }

    public function carrega($origem = '') {
        $this->stts = FALSE;
        $this->set_flPost($origem);

        if ($this->tryCatch(!is_null($this->flPost))) {
            $this->stts = TRUE;
            $this->set_origem($origem);
            $this->dados();
        }
    }

    private function dados() {
        if ($this->eImagem()) {
            $dimensoes = getimagesize($this->origem);
            $this->largura = $dimensoes[0];
            $this->altura = $dimensoes[1];
            $this->formato = $dimensoes[2]; // 1 = gif, 2 = jpeg, 3 = png, 6 = BMP
            $this->tamanho_html = $dimensoes[3];
            $this->criaImagem();
        }
    }

    public function redimensiona($nova_largura = 0, $nova_altura = 0, $tipo = '', $clear = NULL) {
        if ($clear) {
            $this->posicao_crop = '';
        }
        // seta variaveis passadas via parametro
        $this->nova_largura = $nova_largura;
        $this->nova_altura = $nova_altura;

        // verifica se passou altura ou largura como porcentagem
        if (strpos($this->nova_largura, '%')) {
            $porcentagem = ( (int) str_replace('%', '', $this->nova_largura)) / 100;
            $this->nova_largura = round($this->largura * $porcentagem);
        }
        if (strpos($this->nova_altura, '%')) {
            $porcentagem = ( (int) str_replace('%', '', $this->nova_altura)) / 100;
            $this->nova_altura = $this->altura * $porcentagem;
        }

        // define se so passou nova largura ou altura
        if (!$this->nova_largura && !$this->nova_altura) {
            return false;
        } else if (!$this->nova_largura) { // so passou altura
            $this->nova_largura = $this->largura / ($this->altura / $this->nova_altura);
        } else if (!$this->nova_altura) {  // so passou largura
            $this->nova_altura = $this->altura / ($this->largura / $this->nova_largura);
        }

        $method = ($tipo && method_exists($this, "resize_$tipo") ? "resize_$tipo" : "resize");
        $this->$method();
        /* $this->altura = $this->nova_altura;
          $this->largura = $this->nova_largura; */
    }

    /**
     * Redimensiona imagem, cropando para encaixar no novo tamanho, sem sobras
     * atualizado para receber o posicionamento X e Y do crop na imagem
     * @return void
     */
    private function resize_crop() {
        $this->calculaPosicaoCrop();
        $this->nova = imagecreatetruecolor($this->nova_largura, $this->nova_altura);
        $this->preencheImagem();
        imagecopyresampled($this->nova, $this->img, -$this->posicao_crop[0], -$this->posicao_crop[1], 0, 0, $this->posicao_crop[2], $this->posicao_crop[3], $this->largura, $this->altura);
        //$this->img = $this->nova;
    }

    /**
     * Redimensiona imagem sem cropar, proporcionalmente, 
     * preenchendo espaço vazio com cor rgb especificada
     * @param
     * @return void
     */
    private function resize_fill() {
        $this->nova = imagecreatetruecolor($this->nova_largura, $this->nova_altura);
        $this->preencheImagem();
        // salva variaveis para centralizacao
        $dif_y = $this->nova_altura;
        $dif_x = $this->nova_largura;
        // verifica altura e largura
        if ($this->largura > $this->altura) {
            $this->nova_altura = ( ( $this->altura * $this->nova_largura ) / $this->largura );
        } elseif ($this->largura <= $this->altura) {
            $this->nova_largura = ( ( $this->largura * $this->nova_altura ) / $this->altura );
        }
        // copia com o novo tamanho, centralizando
        $dif_x = ( $dif_x - $this->nova_largura ) / 2;
        $dif_y = ( $dif_y - $this->nova_altura ) / 2;
        imagecopyresampled($this->nova, $this->img, $dif_x, $dif_y, 0, 0, $this->nova_largura, $this->nova_altura, $this->largura, $this->altura);
        //$this->img = $this->nova;
    }

    /**
     * Redimensiona imagem, modo padrao, sem crop ou fill (distorcendo)
     * @param
     * @return void
     */
    private function resize() {
        $this->nova = imagecreatetruecolor($this->nova_largura, $this->nova_altura);
        imagecopyresampled($this->nova, $this->img, 0, 0, 0, 0, $this->nova_largura, $this->nova_altura, $this->largura, $this->altura);
        //$this->img = $this->nova;
    }

    public function grava($destino = '', $qualt = 90) {
        if (!empty($this->nova)) {
            if ($destino) {
                $pathinfo = pathinfo($destino);
                $dir = $pathinfo['dirname'];
                $ext = $this->get_ext($pathinfo['extension']);
                $this->tryCatch(is_dir($dir), 'Diretório de destino inválido ou inexistente');
                $this->dirPath = $destino;
            }
            if (!isset($ext)) {
                $ext = $this->ext;
            }
            $this->tryCatch(in_array($ext, $this->extValid), 'Extensão inválida para o arquivo de destino');

            $method = (method_exists($this, "save_$ext") ? "save_$ext" : "save_jpg");
            $this->$method($destino, $qualt);
        } else {
            $this->tryCatch(FALSE, 'sem img');
        }
    }

    private function createSelo($path, $seloTmb, $ret = NULL) {
        if ($path && is_file($path)) {
            list($marca_w, $marca_h) = getimagesize($path);
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if ($ext == 'jpg') {
                $marca = imagecreatefromjpeg($path);
            } else if ($ext == 'png') {
                $marca = imagecreatefrompng($path);
            }
            $seloTmb = (is_null($seloTmb) ? ($marca_w > $this->nova_largura ? TRUE : FALSE) : $seloTmb);
        }
        $this->tryCatch(isset($marca), 'Arquivo de marca d\'água invalido.');
        if ($seloTmb) {
            $seloh = $this->regra3($marca_w, $marca_h, $this->nova_largura);
            $selow = $this->nova_largura;
            $this->selo = imagecreatetruecolor($selow, $seloh);
            if ($ext == 'png') {
                imagealphablending($this->selo, true);
                $corfundo = imagecolorallocatealpha($this->selo, 0, 0, 0, 127);
            } else {
                $corfundo = imagecolorallocate($this->selo, $this->rgb[0], $this->rgb[1], $this->rgb[2]);
            }
            imagefill($this->selo, 0, 0, $corfundo);
            imagecopyresampled($this->selo, $marca, 0, 0, 0, 0, $selow, $seloh, $marca_w, $marca_h);
        } else {
            $this->selo = $marca;
        }
        if ($ret) {
            return ($seloTmb ? array($selow, $seloh) : array($marca_w, $marca_h));
        }
    }

    public function marca($path, $x = 0, $y = 0, $alfa = 100, $isTmb = NULL) {
        if ($path && is_file($path)) {
            if (!is_numeric($alfa)) {
                $isTmb = $alfa;
                $alfa = 100;
            }
            $this->createSelo($path, $isTmb);
        }
        if ($this->selo) {
            $marca_w = imagesx($this->selo);
            $marca_h = imagesy($this->selo);
            if (is_numeric($alfa) && (($alfa > 0) && ($alfa < 100))) {
                imagecopymerge($this->nova, $this->selo, $x, $y, 0, 0, $marca_w, $marca_h, $alfa);
            } else {
                imagecopy($this->nova, $this->selo, $x, $y, 0, 0, $marca_w, $marca_h);
            }
        }
    }

    /**
     * adiciona imagem de marca d'água, com valores fixos
     * @param topo_esquerda, topo_centro, topo_direita
     * @param meio_esquerda, meio_centro, meio_direita
     * @param baixo_esquerda, baixo_centro, baixo_direita
     */
    public function marcaFixa($path, $posicao, $alfa = 100, $isTmb = NULL) {
        if (!is_numeric($alfa)) {
            $isTmb = $alfa;
            $alfa = 100;
        }
        list($marca_w, $marca_h) = $this->createSelo($path, $isTmb, 1);
        list($py, $px) = explode("_", $posicao);
        $x = $y = 0;
        $largura = $this->nova_largura;
        $altura = $this->nova_altura;
        if ($px != 'esquerda') {
            $x = ($px == 'direita' ? 1 : 2);
            $x = ($largura - $marca_w) / $x;
        }
        if ($py == 'meio') {
            $y = ($altura / 2) - ($marca_h / 2);
        } else if ($py == 'baixo') {
            $y = $altura - $marca_h;
        }
        $this->marca('', $x, $y, $alfa);
    }

    private function calculaPosicaoCrop() {
        $hm = $this->altura / $this->nova_altura;
        $wm = $this->largura / $this->nova_largura;
        $h_height = $this->nova_altura / 2;
        $h_width = $this->nova_largura / 2;

        if (!is_array($this->posicao_crop)) {
            if ($wm > $hm) {
                $posCrop = array(0, 0, $this->largura / $hm, $this->nova_altura);
                $posCrop[0] = ($posCrop[2] / 2) - $h_width;
            } else if (($wm <= $hm)) {
                // largura <= altura
                $posCrop = array(0, 0, $this->nova_largura, $this->altura / $wm);
                $posCrop[1] = ($posCrop[3] / 2) - $h_height;
            }
            $this->posicao_crop = $posCrop;
        }
    }

    private function updateImg($reset = NULL) {
        if ($reset === TRUE) {
            $this->posicao_crop = '';
        }
        $this->largura = $this->nova_largura;
        $this->altura = $this->nova_altura;
        $this->img = $this->nova;
    }

    public function calculaCrop($oc = NULL) {
        if (is_object($oc)) {
            $oc->horiz = ($oc->cwidth >= $oc->cheight ? TRUE : FALSE);
            $this->imgNew = FALSE;
            if ($oc->horiz) {
                if ($oc->iwidth > $oc->dwidth || $oc->cwidth > $oc->dwidth) {
                    $largura = $this->regra3($oc->dwidth, $oc->iwidth, $oc->cwidth);
                    $altura = $this->regra3($oc->iwidth, $oc->iheight, $largura);
                    $this->redimensiona($largura, $altura, 'crop');

                    $this->updateImg();

                    $oc->dleft = $this->regra3($oc->iwidth, $oc->dleft, $this->largura);
                    $oc->dtop = $this->regra3($oc->iheight, $oc->dtop, $this->altura);
                }
                $this->posicaoCrop($oc->dleft, $oc->dtop);
                $this->redimensiona($oc->cwidth, $oc->cheight, 'crop');
            } else {
                if ($oc->iheight > $oc->dheight || $oc->cheight > $oc->dheight) {
                    $altura = $this->regra3($oc->dheight, $oc->iheight, $oc->cheight);
                    $largura = $this->regra3($oc->iheight, $oc->iwidth, $altura);
                    $this->redimensiona($largura, $altura, 'crop');

                    $this->updateImg();

                    $oc->dleft = $this->regra3($oc->iwidth, $oc->dleft, $this->largura);
                    $oc->dtop = $this->regra3($oc->iheight, $oc->dtop, $this->altura);
                }
                $this->posicaoCrop($oc->dleft, $oc->dtop);
                $this->redimensiona($oc->cwidth, $oc->cheight, 'crop');
            }
        }
    }

    public function posicaoCrop($x, $y) {
        $this->posicao_crop = array($x, $y, $this->largura, $this->altura);
    }

    private function preencheImagem() {
        if ($this->bg === 'trans') {
            imagealphablending($this->nova, true);
            $corfundo = imagecolorallocatealpha($this->nova, 0, 0, 0, 127);
        } else {
            $corfundo = imagecolorallocate($this->nova, $this->rgb[0], $this->rgb[1], $this->rgb[2]);
        }
        imagefill($this->nova, 0, 0, $corfundo);
    }

    public function set_origem($origem) {
        // Atualizar Dados ***********
        $pInfo = pathinfo(($this->flPost ? $_FILES[$origem]['name'] : $origem));

        $this->tamanho = ($this->flPost ? $_FILES[$origem]['size'] : filesize($origem));
        $this->arquivo = ($this->flPost ? $_FILES[$origem]['name'] : $pInfo['basename']);
        $this->origem = ($this->flPost ? $_FILES[$origem]['tmp_name'] : $origem);
        $this->diretorio = $pInfo['dirname'];

        $this->set_ext($pInfo['extension']);
        return $this;
    }

    private function set_flPost($flPost) {
        $this->flPost = NULL;
        $this->coffin = 'Erro: Arquivo de imagem nao definido!';
        if (strpos($flPost, '.') !== FALSE) {
            $this->flPost = (is_file($flPost) ? FALSE : NULL);
            $this->coffin = 'Erro: Arquivo de imagem nao encontrado!';
        } else if (isset($_FILES)) {
            $this->flPost = (empty($_FILES[$flPost]['tmp_name']) ? NULL : TRUE);
            $this->coffin = "Erro: FILES '$flPost' nao encontrado!";
        }
        return $this;
    }

    private function criaImagem() {
        $origem = $this->origem;
        if ($this->formato === 2) {
            $this->img = imagecreatefromjpeg($origem);
            $this->ext = 'jpg';
        } else if ($this->formato === 3) {
            $this->img = imagecreatefrompng($origem);
            $this->ext = 'png';
        } else if ($this->formato === 1) {
            $this->img = imagecreatefromgif($origem);
            $this->ext = 'gif';
        } else if ($this->formato === 6) {
            $this->img = imagecreatefrombmp($origem);
            $this->ext = 'bmp';
        } else {
            $this->tryCatch(FALSE, 'Arquivo invalido!');
        }
    }

    public function set_img($img) {
        $this->img = $img;
        return $this;
    }

    public function set_nova($nova) {
        $this->nova = $nova;
        return $this;
    }

    public function set_extValid($extValid = NULL) {
        if ($extValid && preg_match_all('/(jpeg|jpg|png|gif|bmp)/i', $extValid, $match)) {
            $this->extValid = $match[0];
        } else {
            $this->extValid = array('jpg', 'jpeg', 'jpe', 'png');
            if (is_null($extValid)) {
                array_push($this->extValid, 'gif', 'bmp');
            }
        }
        return $this;
    }

    private function save_jpg($destino, $qualt) {
        if ($destino) {
            imagejpeg($this->nova, $destino, $qualt);
        } else {
            header("Content-type: image/jpeg");
            imagejpeg($this->nova, NULL, $qualt);
        }
    }

    private function save_png($destino = '') {
        if ($this->bg === 'trans') {
            imagealphablending($this->nova, false);
            imagesavealpha($this->nova, true);
        }
        if ($destino) {
            imagepng($this->nova, $destino);
        } else {
            header("Content-type: image/png");
            imagepng($this->nova);
        }
    }

    private function save_gif($destino = '') {
        if ($destino) {
            imagegif($this->nova, $destino);
        } else {
            header("Content-type: image/gif");
            imagegif($this->nova);
        }
    }

    public function set_ext($ext) {
        // $this->ext = str_ireplace(array('jpeg', 'jpe'), 'jpg', strtolower($ext));
        $this->ext = strtolower($ext);
        return $this;
    }

    public function set_posicao_crop($posicao_crop) {
        $this->posicao_crop = $posicao_crop;
        return $this;
    }

    public function set_stts($stts) {
        $this->stts = $stts;
        return $this;
    }

    public function set_status($status = NULL) {
        if (is_null($status)) {
            $this->coffin = ($this->stts ? '' : ($this->coffin ? $this->coffin : "Erro: Internal service error!"));
            $status = ($this->stts === TRUE ? 'ok' : 'erro');
        }
        $this->status = $status;
        return $this;
    }

    public function set_coffin($coffin) {
        $this->coffin = $coffin;
        return $this;
    }

    public function set_rgb($rgb) {
        if ($rgb == 'trans') {
            $this->bg = 'trans';
            $rgb = 0;
        }
        $this->rgb = iCrop::hexRgb((is_null($rgb) ? 255 : $rgb));
        return $this;
    }

    public function set_bg($bg) {
        $this->bg = $bg;
        return $this;
    }

    /* =================
     *      GET'S
     * ================= */

    private function eImagem() {
        return $this->tryCatch(in_array($this->ext, $this->extValid), 'Erro: Arquivo ' . $this->arquivo . ' nao e uma imagem válida!');
    }

    public function valida() {
        return $this->stts;
    }

    public function get_origem($part = NULL) {
        if ($this->flPost && $part) {
            $part = ($part === 1 ? 'tmp_name' : $part);
            return $_FILES['inputFile'][$part];
        } else {
            return $this->origem;
        }
    }

    public function get_extValid() {
        return $this->extValid;
    }

    public function get_ext($ext = NULL) {
        if ($ext) {
            return strtolower($ext);
        } else {
            return $this->ext;
        }
    }

    public function get_posicao_crop() {
        return $this->posicao_crop;
    }

    public function get_stts() {
        return $this->stts;
    }

    public function get_status() {
        return $this->status;
    }

    public function get_coffin() {
        return $this->coffin;
    }

    public function get_rgb() {
        return $this->rgb;
    }

    public function get_bg() {
        return $this->bg;
    }

    private function imageDestroy($img) {
        if ($img === 'nova') {
            imagedestroy($this->nova);
            $this->nova = NULL;
        } else if ($img === 'img') {
            imagedestroy($this->img);
            $this->img = NULL;
        }
        return $this;
    }

    static function hexRgb($hex) {
        if (is_numeric($hex)) {
            $r = $g = $b = $hex;
        } else {
            $hex = str_replace("#", "", $hex);
            if (strlen($hex) == 3) {
                $r = hexdec(substr($hex, 0, 1) . substr($hex, 0, 1));
                $g = hexdec(substr($hex, 1, 1) . substr($hex, 1, 1));
                $b = hexdec(substr($hex, 2, 1) . substr($hex, 2, 1));
            } else {
                $r = hexdec(substr($hex, 0, 2));
                $g = hexdec(substr($hex, 2, 2));
                $b = hexdec(substr($hex, 4, 2));
            }
        }
        return array($r, $g, $b);
    }

    public function regra3($v1, $v2, $v3, $v4 = NULL) {
        if (is_null($v4)) {
            return ($v3 * $v2) / $v1;
        } else {
            return ($v4 * $v1) / $v2;
        }
    }

    private function tryCatch($exp, $erro = NULL) {
        if (is_string($exp) && is_null($erro)) {
            $erro = $exp;
            $exp = $this->stts;
        }
        try {
            if ($exp === TRUE) {
                $this->coffin = '';
                $this->stts = TRUE;
            } else {
                $this->coffin = ($erro ? $erro : (empty($this->coffin) ? "Erro: Internal service error!" : $this->coffin));
                $this->stts = FALSE;
                throw new Exception($this->coffin);
            }
        } catch (Exception $e) {
            $msg = $e->getMessage();
            $e = $e->getTrace();
            unset($e[1]['type']);
            unset($e[1]['args']);
            $e = array_merge(array('Erro' => $msg), $e[1]);
            $e['file'] = '/imgcrop/class.crop.php';
            $this->dirPath = $e;
            $this->status = 'erro';
            $this->coffin = '';
            echo json_encode($this->retCrop(1));
            /*  echo "<br>Warning ";
              print_r($e);
              echo "<br>"; */
            exit();
        }
        return $this->stts;
    }

    public function resetClass($origem = NULL) {
        if (!is_null($origem)) {
            $vClass = array("origem" => NULL, "flPost" => NULL, "img" => NULL, "nova" => NULL, "imgNew" => NULL,
                "formato" => NULL, "ext" => NULL, "tamanho" => NULL, "arquivo" => NULL, "diretorio" => NULL, "largura" => NULL,
                "altura" => NULL, "dirPath" => NULL, "nova_largura" => NULL, "nova_altura" => NULL, "tamanho_html" => NULL,
                "posicao_crop" => NULL, "stts" => false, "status" => NULL, "coffin" => "");
            foreach ($vClass as $key => $value) {
                $this->$key = $value;
            }
            $this->carrega($origem);
        }
    }

}
