const qiniu = require('qiniu');
const { AK, SK, bucket } = require('./qiniu_env.js');
const package = require('./package.json');

qiniu.conf.ACCESS_KEY = AK;
qiniu.conf.SECRET_KEY = SK;

// * 构建上传策略函数
const uptoken = (bucket, key) => new qiniu.rs.PutPolicy(bucket + ':' + key).token();

const toLatest = (name) => name.replace(/\d+\.\d+\.\d+/, 'latest');
const onlyName = (name) => name.replace(/dist\//, '');

// * 构建客户端实例
const client = new qiniu.rs.Client();

// * 上传单个文件
const uploadFile = (token, file, localFile) =>
  new Promise((resolve) => {
    const extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(token, file, localFile, extra, (err) => {
      return err ? resolve(false) : resolve(true);
    });
  });

// * 删除单个文件
const removeFile = (file) =>
  new Promise((resolve) => {
    client.remove(bucket, file, (err, ret) => {
      return err ? resolve(false) : resolve(true);
    });
  });

// * 拷贝单个文件
const cpFile = (fromFile, toFile) =>
  new Promise((resolve) => {
    client.copy(bucket, fromFile, bucket, toFile, (err) => {
      return err ? resolve(false) : resolve(true);
    });
  });

const version = package.version;
const fileList = ['release/eoapi-Setup-?.exe', 'release/eoapi-?.dmg', 'release/eoapi-?-arm64.dmg'].map((it) =>
  it.replace(/\?/, `${version}`)
);

const app = async () => {
  const uploadResult = await Promise.all(
    fileList.map(async (it) => {
      // * 生成上传 Token
      const token = uptoken(bucket, `${version}/${it.replace(/dist\//, '')}`);
      const isOK = await uploadFile(token, `${version}/${it.replace(/dist\//, '')}`, it);
      return Promise.resolve(isOK || false);
    })
  );
  console.log('上传结果：', uploadResult);
  const deleteResult = await Promise.all(
    fileList.map(async (it) => {
      const isOK = await removeFile(bucket, `latest/${toLatest(onlyName(it))}`);
      Promise.resolve(isOK || false);
    })
  );
  console.log('删除结果：', deleteResult);
  const copyResult = await Promise.all(
    fileList.map(async (it) => {
      const isOK = await cpFile(`${version}/${onlyName(it)}`, `latest/${toLatest(onlyName(it))}`);
      Promise.resolve(isOK || false);
    })
  );
  console.log('拷贝结果', copyResult);
};

app();