<?php

/**
 * Description of imgCrop
 *
 */
class cropController {

    public $path, $tmb, $dir, $status, $coffin;
    //
    private $fileName, $recoil, $accept, $trans;
    private $imgPath, $seloPath, $seloFix;
    private $oTmb, $oFile, $oSize, $oCrop;

    public function addValues($vArg) {
        foreach ($vArg as $method => $val) {
            $method = "set_$method";
            if (method_exists($this, $method)) {
                $val = ($val == 'null' || $val == 'false' ? '' : $val);
                $this->$method($val);
            }
        }
        if (key_exists('filePath', $vArg)) {
            $this->setFilePath($vArg['filePath']);
        }
    }

    private function addRequest($vPost) {
        $oSize = array_combine(array('cwidth', 'cheight', 'iwidth', 'iheight', 'dwidth', 'dheight', 'dtop', 'dleft'), array_fill(0, 8, NULL));
        $oc = array_intersect_key($vPost, $oSize);
        if ($oc) {
            $oSize = array_merge($oSize, $oc);
            $vPost = array_diff_key($vPost, $oSize);
            $this->oSize = (object) $oSize;
        }
        $this->addValues($vPost);
    }

    function __construct() {
        $this->status = "info";
        $this->coffin = "";
        if (isset($_POST) && !empty($_POST['acao'])) {
            $this->addRequest($_POST);
        }
    }

    private function fotoTmbSelo($oCrop) {
        if ($this->oTmb) {
            $oCrop->redimensiona($this->oTmb->width, $this->oTmb->height, 'crop', TRUE);
            if ($this->seloPath) {
                $oCrop->marcaFixa($this->seloPath, $this->seloFix, TRUE);
            }
            $oCrop->grava($this->oTmb->path);
        }
    }

    public function cropFotoSeloAction() {
        $ret = '';
        $oCrop = $this->get_oCrop();
        if ($oCrop && $oCrop->valida()) {
            $oc = $this->oSize;
            $oCrop->redimensiona($oc->cwidth, $oc->cheight, 'crop');
            if ($this->seloPath) {
                $oCrop->marcaFixa($this->seloPath, $this->seloFix);
            }
            $oCrop->grava($this->imgPath);
            $this->fotoTmbSelo($oCrop);
            $ret = $oCrop->retCrop(1);
        }
        return $this->getReturn(1, $ret);
    }

    public function cropImgAction() {
        $ret = '';
        $oCrop = $this->get_oCrop();
        if ($oCrop && $oCrop->valida()) {
            $oc = $this->oSize;
            $oCrop->calculaCrop($oc);
            $oCrop->grava($this->imgPath);
            $ret = $oCrop->retCrop(1);
        }
        return $this->getReturn(1, $ret);
    }

    public function getReturn($encod = NULL, $add = NULL, $rmv = NULL) {
        $aRet = array();
        $encod = (is_numeric($encod) ? $encod : 1);
        if (is_array($add) || is_object($add)) {
            $this->addValues($add);
            $aRet = (array) $add;
            $add = NULL;
        }
        $add = ($encod < 2 || !empty($add) ? "path,tmb,dir,status,coffin" . (is_string($add) ? ",$add" : '') : NULL);
        $oRet = get_object_vars($this);
        if ($encod < 2) {
            $aFlip = array_flip(explode(',', ($add ? $add : "oTmb,oFile,oSize,oCrop,accept,recoil")));
            $oRet = ($add ? array_intersect_key($oRet, $aFlip) : array_diff_key($oRet, $aFlip));
        }
        $oRet = array_merge($aRet, $oRet);
        if (!empty($rmv) && is_string($rmv)) {
            $oRet = array_diff_key($oRet, array_flip(explode(',', $rmv)));
        }
        return $oRet;
    }

    public function setFilePath($filePath) {
        $pi = pathinfo($filePath);
        $oInfo = (object) array('dir' => $pi['dirname'], 'file' => $pi['basename'], 'ext' => strtolower($pi['extension']), 'name' => $pi['filename']);

        $this->set_fileName('', $oInfo);
        $dir = $oInfo->dir;
        if (!$this->isDir($dir) && !$this->isDir(substr($dir, 0, strrpos($dir, '/')))) {
            $dir = FALSE;
        }
        $this->setDir($dir, $oInfo->dir);
        if ($this->dir) {
            $this->oFile = $oInfo;
            $this->path = $filePath;
            $this->imgPath = $this->dir . $oInfo->file;
            $this->set_oTmb();
            $this->set_seloPath(NULL);
            $this->setChmod(1);
            $this->set_oCrop(NULL);
        }
    }

    public function set_fileName($fileName, &$obj = NULL) {
        $fileName = ($obj ? $obj->name : $fileName);
        if (strpos($fileName, 'TIME') !== FALSE) {
            $fileName = str_replace('TIME', time(), $fileName);
        }
        if ($obj) {
            $this->set_trans(null, $obj->ext);
            $obj->name = $fileName;
            $obj->file = $fileName = "$obj->name.$obj->ext";
        }
        $this->fileName = $fileName;
        return $this;
    }

    private function isDir($dir) {
        return (is_dir($dir) ? $dir : FALSE);
    }

    public function set_sizetmb($sizetmb, $key = null) {
        if (is_null($this->oTmb) && is_null($key) && !empty($sizetmb) && $sizetmb != "null") {
            $oTmb = (object) array('width' => '', 'height' => '', 'path' => '');
            list($oTmb->width, $oTmb->height) = explode('x', strtolower($sizetmb) . (stripos($sizetmb, 'x') ? '' : 'x'));
            $this->oTmb = $oTmb;
            return $this;
        } else if ($key && $this->oTmb) {
            $this->oTmb->$key = $sizetmb;
        }
    }

    public function set_path($path) {
        $this->path = $path;
        return $this;
    }

    public function set_tmb($tmb) {
        $this->tmb = $tmb;
        return $this;
    }

    public function setDir($dir, $idir) {
        if ($dir) {
            $this->dir = $dir . '/';
        } else if ($idir) {
            $dir = preg_replace('/^[\/ \.\.\/]+/', '', $idir);
            $idir = substr($dir, 0, strpos($dir, '/'));
            $tdir = $this->isDir($this->recoil . $idir);
            if (!$tdir) {
                $rec = "../";
                for ($i = 0; !is_dir("$rec$idir") && $i < 5; $i++) {
                    $rec .= "../";
                }
                $tdir = $this->isDir("$rec$idir");
                if ($tdir) {
                    $this->set_recoil($rec);
                }
            }
            if ($tdir) {
                $this->dir = $this->recoil . $dir . '/';
            }
        }
        return $this;
    }

    public function set_dir($dir) {
        $this->dir = ($dir ? $this->isDir($dir) : FALSE);
        return $this;
    }

    public function set_status($status) {
        $this->status = $status;
        return $this;
    }

    public function set_coffin($coffin) {
        $this->coffin = $coffin;
        return $this;
    }

    public function set_recoil($recoil) {
        if (is_numeric($recoil)) {
            $recoil = str_repeat('../', $recoil);
        }
        $this->recoil = $recoil;
        return $this;
    }

    public function set_accept($accept) {
        if (!empty($accept) && preg_match_all('/(jpeg|jpg|png|gif|bmp)/i', $accept, $match)) {
            $accept = implode(',', $match[0]);
        } else {
            $accept = 'jpg,png';
        }
        $this->accept = $accept;
        return $this;
    }

    public function set_trans($trans, $ext = NULL) {
        if (!is_null($ext)) {
            $trans = ($this->accept === 'png' && $ext === 'png' ? 'trans' : NULL);
        }
        $this->trans = $trans;
        return $this;
    }

    public function set_imgPath($imgPath) {
        $this->imgPath = $imgPath;
        return $this;
    }

    public function set_seloPath($seloPath) {
        if (!empty($this->seloPath) && $this->seloPath != 'null' && is_null($seloPath)) {
            $seloPath = $this->recoil . $this->seloPath;
        }
        $this->seloPath = $seloPath;
        return $this;
    }

    public function set_seloFix($seloFix) {
        $this->seloFix = $seloFix;
        return $this;
    }

    public function set_oTmb($oTmb = NULL) {
        if (is_null($oTmb) && $this->oTmb) {
            $this->tmb = str_replace('img/', 'tmb/', $this->path);
            $this->oTmb->path = str_replace('img/', 'tmb/', $this->imgPath);
        }
        return $this;
    }

    public function set_oFile($oFile) {
        $this->oFile = $oFile;
        return $this;
    }

    public function set_oSize($oSize) {
        $this->oSize = $oSize;
        return $this;
    }

    public function set_oCrop($oCrop) {
        if (is_null($oCrop) && is_null($this->oCrop)) {
            require_once 'class.crop.php';
            $this->oCrop = new iCrop('inputFile', $this->accept, $this->trans);
        }
        return $this;
    }

    /* GET'S */

    public function get_oCrop($forc = NULL) {
        if (is_null($this->oCrop) && $forc) {
            require_once 'class.crop.php';
            $this->oCrop = new iCrop();
        }
        return $this->oCrop;
    }

    public function get_path() {
        return $this->path;
    }

    public function get_tmb() {
        return $this->tmb;
    }

    public function get_dir() {
        return $this->dir;
    }

    public function get_status() {
        return $this->status;
    }

    public function get_coffin() {
        return $this->coffin;
    }

    public function get_fileName() {
        return $this->fileName;
    }

    public function get_recoil() {
        return $this->recoil;
    }

    public function get_accept() {
        return $this->accept;
    }

    public function get_trans() {
        return $this->trans;
    }

    public function get_imgPath() {
        return $this->imgPath;
    }

    public function get_seloPath() {
        return $this->seloPath;
    }

    public function get_seloFix() {
        return $this->seloFix;
    }

    public function get_oTmb() {
        return $this->oTmb;
    }

    public function get_oFile() {
        return $this->oFile;
    }

    public function get_oSize() {
        return $this->oSize;
    }

    public function setChmod($mod = 0) {
        $vDir = array($this->dir);
        if ($this->oTmb) {
            array_push($vDir, str_replace('img/', 'tmb/', $this->dir));
        }
        foreach ($vDir as $dir) {
            if ($mod && is_dir($dir) === FALSE) {
                $old = umask(0);
                mkdir($dir, 0777, true);
                umask($old);
            } else if ($_SERVER['REMOTE_ADDR'] != '127.0.0.1') {
                $mod = ($mod ? 0777 : 0755);
                chmod($dir, $mod);
            }
        }
    }

}

if (isset($_POST) && !empty($_POST['acao'])) {
    $method = $_POST['acao'] . "Action";
    $oControl = new cropController();
    if (method_exists($oControl, $method)) {
        $ret = $oControl->$method();
    }
    echo (isset($ret) ? (is_string($ret) ? $ret : json_encode($ret)) : '{"status": "erro", "coffin": ""}');
}